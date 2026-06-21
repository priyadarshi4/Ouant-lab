import multer from "multer";
import Backtest from "../models/Backtest.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getGeminiClient, GEMINI_MODEL, cleanJsonResponse } from "../config/gemini.js";

// Screenshots stay in memory only - we pass them to Gemini, don't store them.
export const uploadScreenshot = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const EXTRACTION_PROMPT = `You are a quantitative research assistant. This is a TradingView Strategy Tester screenshot.

Extract EVERY number you can see. Return ONLY a valid JSON object with these exact keys (use null for anything not visible):

{
  "netProfit": number,
  "grossProfit": number,
  "grossLoss": number,
  "buyAndHoldReturn": number,
  "maxRunup": number,
  "maxDrawdown": number,
  "profitFactor": number,
  "winRate": number,
  "sharpeRatio": number,
  "sortinoRatio": number,
  "calmarRatio": number,
  "recoveryFactor": number,
  "expectancy": number,
  "averageTrade": number,
  "averageWin": number,
  "averageLoss": number,
  "largestWin": number,
  "largestLoss": number,
  "totalTrades": number,
  "winningTrades": number,
  "losingTrades": number,
  "longTrades": number,
  "shortTrades": number,
  "longWinRate": number,
  "shortWinRate": number,
  "averageBarsInTrade": number,
  "averageHoldingDays": number,
  "averageHoldingHours": number,
  "consecutiveWins": number,
  "consecutiveLosses": number,
  "largestWinStreak": number,
  "largestLossStreak": number,
  "symbol": "string or null",
  "timeframe": "string or null",
  "exchange": "string or null",
  "dateRangeStart": "YYYY-MM-DD or null",
  "dateRangeEnd": "YYYY-MM-DD or null",
  "initialCapital": number
}

Rules:
- Strip all % signs, commas, currency symbols - store raw numbers only
- winRate, longWinRate, shortWinRate, buyAndHoldReturn, maxRunup, maxDrawdown are percentages - store as numbers (e.g. 45.03 not 0.4503)
- If the screenshot shows a "Performance Summary" section, read every value carefully
- If the screenshot shows "Trade Statistics" section, read those too
- Return ONLY the JSON object, no markdown fences, no explanation`;

// POST /api/extract/screenshot
// Accepts multipart field "file" (image) + optional field "backtestId"
// Returns the extracted metrics JSON. If backtestId is provided, also patches
// that backtest document immediately so the user never has to type anything.
export const extractFromScreenshot = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("No screenshot received");
  }

  const gemini = getGeminiClient();
  if (!gemini) {
    res.status(503);
    throw new Error("GEMINI_API_KEY is not configured on the server. Add it to server/.env to enable AI extraction (free at https://aistudio.google.com/apikey).");
  }

  const base64 = req.file.buffer.toString("base64");
  const mediaType = req.file.mimetype || "image/jpeg";

  const response = await gemini.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      { inlineData: { mimeType: mediaType, data: base64 } },
      { text: EXTRACTION_PROMPT },
    ],
  });

  const raw = response.text || "";
  const cleaned = cleanJsonResponse(raw);

  let extracted;
  try {
    extracted = JSON.parse(cleaned);
  } catch {
    res.status(422);
    throw new Error("AI could not parse the screenshot — try a clearer, closer screenshot of the Performance Summary.");
  }

  // Remove top-level string fields that belong outside metrics
  const { symbol, timeframe, exchange, dateRangeStart, dateRangeEnd, initialCapital, ...metrics } = extracted;

  // Drop null values so we don't overwrite previously filled fields with null
  const cleanMetrics = Object.fromEntries(Object.entries(metrics).filter(([, v]) => v !== null));
  const cleanMeta = Object.fromEntries(
    Object.entries({ symbol, timeframe, exchange, dateRangeStart, dateRangeEnd, initialCapital })
      .filter(([, v]) => v !== null)
  );

  // If a backtestId was supplied, auto-patch the document now
  if (req.body.backtestId) {
    const update = { ...cleanMeta, "metrics": {} };
    // Use $set with dot-notation to merge metrics rather than replace them
    const setPayload = {};
    Object.entries(cleanMetrics).forEach(([k, v]) => { setPayload[`metrics.${k}`] = v; });
    Object.entries(cleanMeta).forEach(([k, v]) => { setPayload[k] = v; });

    await Backtest.findByIdAndUpdate(req.body.backtestId, { $set: setPayload });
  }

  res.json({
    metrics: cleanMetrics,
    meta: cleanMeta,
    saved: !!req.body.backtestId,
    rawResponse: process.env.NODE_ENV === "development" ? raw : undefined,
  });
});

// POST /api/extract/equity-csv
// Accepts a CSV file where col 0 = date, col 1 = equity value.
// Parses it into the equityCurve array format and patches the backtest.
export const extractEquityCsv = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("No CSV file received");
  }
  if (!req.body.backtestId) {
    res.status(400);
    throw new Error("backtestId is required");
  }

  const text = req.file.buffer.toString("utf8");
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  // Skip header row if first cell isn't a date-like string
  const dataLines = /^\d{4}|^\d{2}\/|^\d{2}-/.test(lines[0]) ? lines : lines.slice(1);

  const equityCurve = [];
  let peak = 0;
  dataLines.forEach((line) => {
    const cols = line.split(",");
    const dateStr = cols[0]?.trim().replace(/"/g, "");
    const equity = parseFloat(cols[1]?.trim().replace(/"/g, ""));
    const benchmark = cols[2] ? parseFloat(cols[2]?.trim().replace(/"/g, "")) : undefined;
    if (!dateStr || isNaN(equity)) return;
    const t = new Date(dateStr);
    if (isNaN(t.getTime())) return;
    peak = Math.max(peak, equity);
    const drawdown = peak > 0 ? ((equity - peak) / peak) * 100 : 0;
    const point = { t, equity, drawdown: Number(drawdown.toFixed(2)) };
    if (benchmark !== undefined && !isNaN(benchmark)) point.benchmarkEquity = benchmark;
    equityCurve.push(point);
  });

  if (!equityCurve.length) {
    res.status(422);
    throw new Error("No valid date,equity rows found. Expected columns: Date, Equity[, Benchmark]");
  }

  await Backtest.findByIdAndUpdate(req.body.backtestId, { equityCurve });

  res.json({ count: equityCurve.length, message: `Imported ${equityCurve.length} equity curve points.` });
});

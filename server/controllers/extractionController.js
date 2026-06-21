import Anthropic from "@anthropic-ai/sdk";
import multer from "multer";
import fs from "fs";
import asyncHandler from "../utils/asyncHandler.js";
import Backtest from "../models/Backtest.js";

// In-memory multer for extraction uploads — we don't persist the screenshot,
// we just read it and discard it.
export const extractUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
});

// POST /api/backtests/extract-screenshot
// Accepts one image (field "file") — a TradingView strategy tester screenshot.
// Returns a pre-filled metrics + setup object ready to POST to /api/backtests.
export const extractFromScreenshot = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("No image uploaded");
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(503);
    throw new Error("ANTHROPIC_API_KEY is not set on the server — AI extraction unavailable");
  }

  const base64 = req.file.buffer.toString("base64");
  const mediaType = req.file.mimetype || "image/png";

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: base64 },
          },
          {
            type: "text",
            text: `This is a screenshot of a TradingView Strategy Tester results page.

Extract every number you can read and return ONLY a single valid JSON object with these exact keys.
If a value is not visible or unreadable, use null. Never invent numbers.

{
  "symbol": string or null,
  "timeframe": string or null,
  "exchange": string or null,
  "dateRangeStart": "YYYY-MM-DD" or null,
  "dateRangeEnd": "YYYY-MM-DD" or null,
  "initialCapital": number or null,
  "commission": number or null,
  "netProfit": number or null,
  "grossProfit": number or null,
  "grossLoss": number or null,
  "buyAndHoldReturn": number or null,
  "maxRunup": number or null,
  "maxDrawdown": number or null,
  "profitFactor": number or null,
  "winRate": number or null,
  "sharpeRatio": number or null,
  "sortinoRatio": number or null,
  "calmarRatio": number or null,
  "recoveryFactor": number or null,
  "expectancy": number or null,
  "averageTrade": number or null,
  "averageWin": number or null,
  "averageLoss": number or null,
  "largestWin": number or null,
  "largestLoss": number or null,
  "totalTrades": number or null,
  "winningTrades": number or null,
  "losingTrades": number or null,
  "longTrades": number or null,
  "shortTrades": number or null,
  "longWinRate": number or null,
  "shortWinRate": number or null,
  "averageBarsInTrade": number or null,
  "averageHoldingDays": number or null,
  "averageHoldingHours": number or null,
  "consecutiveWins": number or null,
  "consecutiveLosses": number or null,
  "largestWinStreak": number or null,
  "largestLossStreak": number or null
}

Return ONLY the JSON object. No markdown, no explanation.`,
          },
        ],
      },
    ],
  });

  const text = response.content.find((b) => b.type === "text")?.text || "{}";
  const cleaned = text.replace(/```json|```/g, "").trim();

  let extracted;
  try {
    extracted = JSON.parse(cleaned);
  } catch {
    res.status(422);
    throw new Error("Could not parse AI response as JSON — try a cleaner screenshot");
  }

  // Split extracted flat fields into the shape the Backtest model expects
  const {
    symbol, timeframe, exchange, dateRangeStart, dateRangeEnd, initialCapital, commission,
    netProfit, grossProfit, grossLoss, buyAndHoldReturn, maxRunup, maxDrawdown,
    profitFactor, winRate, sharpeRatio, sortinoRatio, calmarRatio, recoveryFactor,
    expectancy, averageTrade, averageWin, averageLoss, largestWin, largestLoss,
    totalTrades, winningTrades, losingTrades, longTrades, shortTrades,
    longWinRate, shortWinRate, averageBarsInTrade, averageHoldingDays, averageHoldingHours,
    consecutiveWins, consecutiveLosses, largestWinStreak, largestLossStreak,
  } = extracted;

  res.json({
    setup: { symbol, timeframe, exchange, dateRangeStart, dateRangeEnd, initialCapital, commission },
    metrics: {
      netProfit, grossProfit, grossLoss, buyAndHoldReturn, maxRunup, maxDrawdown,
      profitFactor, winRate, sharpeRatio, sortinoRatio, calmarRatio, recoveryFactor,
      expectancy, averageTrade, averageWin, averageLoss, largestWin, largestLoss,
      totalTrades, winningTrades, losingTrades, longTrades, shortTrades,
      longWinRate, shortWinRate, averageBarsInTrade, averageHoldingDays, averageHoldingHours,
      consecutiveWins, consecutiveLosses, largestWinStreak, largestLossStreak,
    },
  });
});

// POST /api/backtests/:id/import-equity-csv
// Accepts a CSV with columns: date,equity,drawdown,benchmark  (header row required)
// Parses it and saves the equityCurve array to the backtest document.
export const importEquityCsv = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("No CSV uploaded");
  }

  const text = req.file.buffer.toString("utf-8");
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) {
    res.status(400);
    throw new Error("CSV must have a header row and at least one data row");
  }

  const header = lines[0].toLowerCase().split(",").map((h) => h.trim());
  const dateIdx = header.findIndex((h) => h.includes("date") || h.includes("time"));
  const equityIdx = header.findIndex((h) => h.includes("equity") || h.includes("balance"));
  const drawdownIdx = header.findIndex((h) => h.includes("drawdown") || h.includes("dd"));
  const benchmarkIdx = header.findIndex((h) => h.includes("bench") || h.includes("bnh") || h.includes("hold"));

  if (dateIdx === -1 || equityIdx === -1) {
    res.status(400);
    throw new Error("CSV must have at least 'date' and 'equity' columns");
  }

  const equityCurve = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    const dateStr = cols[dateIdx]?.trim();
    const equityVal = parseFloat(cols[equityIdx]);
    if (!dateStr || isNaN(equityVal)) continue;
    equityCurve.push({
      t: new Date(dateStr),
      equity: equityVal,
      drawdown: drawdownIdx !== -1 ? parseFloat(cols[drawdownIdx]) || 0 : 0,
      benchmarkEquity: benchmarkIdx !== -1 ? parseFloat(cols[benchmarkIdx]) || undefined : undefined,
    });
  }

  if (!equityCurve.length) {
    res.status(400);
    throw new Error("No valid rows found in CSV");
  }

  const backtest = await Backtest.findByIdAndUpdate(
    req.params.id,
    { equityCurve },
    { new: true }
  );

  if (!backtest) {
    res.status(404);
    throw new Error("Backtest not found");
  }

  res.json({ message: `Imported ${equityCurve.length} equity curve points`, backtest });
});

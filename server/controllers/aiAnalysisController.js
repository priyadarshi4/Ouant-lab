import Strategy from "../models/Strategy.js";
import Backtest from "../models/Backtest.js";
import ResearchNote from "../models/ResearchNote.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getGeminiClient, GEMINI_MODEL, cleanJsonResponse } from "../config/gemini.js";
import { logTimelineEvent } from "./timelineController.js";

const ANALYSIS_FIELDS = [
  "executiveSummary", "strengths", "weaknesses", "riskAssessment", "failureRegimes",
  "robustnessAnalysis", "overfittingAssessment", "marketSuitability",
  "positionSizingSuggestions", "portfolioSuitability", "potentialImprovements", "expectedFutureRisks",
];

// POST /api/strategies/:id/ai-analysis
// Regenerates the AI Strategy Analyst report from the strategy's current
// state. Requires GEMINI_API_KEY - this feature has no offline fallback
// because, unlike report drafting, there's no useful deterministic
// substitute for "act like a quant researcher and assess this critically."
export const generateAiAnalysis = asyncHandler(async (req, res) => {
  const strategy = await Strategy.findById(req.params.id).populate("indicators", "name");
  if (!strategy) {
    res.status(404);
    throw new Error("Strategy not found");
  }

  const gemini = getGeminiClient();
  if (!gemini) {
    res.status(503);
    throw new Error("GEMINI_API_KEY is not configured on the server. Add it to server/.env to enable the AI Strategy Analyst.");
  }

  const backtests = await Backtest.find({ strategy: strategy._id }).sort({ createdAt: -1 }).limit(3);
  const notes = await ResearchNote.find({ strategy: strategy._id }).sort({ createdAt: -1 }).limit(10);

  const context = {
    name: strategy.name,
    type: strategy.strategyType,
    status: strategy.status,
    maturityStage: strategy.maturityStage,
    description: strategy.description,
    documentation: strategy.documentation,
    entryConditions: strategy.entryConditions,
    exitConditions: strategy.exitConditions,
    riskManagement: strategy.riskManagement,
    trailingStop: strategy.trailingStop,
    indicators: (strategy.indicators || []).map((i) => i.name),
    mathematicalFramework: (strategy.mathematicalFramework || []).map((f) => ({ label: f.label, latex: f.latex })),
    recentBacktests: backtests.map((b) => ({
      symbol: b.symbol, timeframe: b.timeframe, marketPhase: b.marketPhase, metrics: b.metrics,
    })),
    recentResearchNotes: notes.map((n) => ({ type: n.type, title: n.title, content: n.content.slice(0, 300) })),
  };

  const prompt =
    "You are a professional quantitative researcher at a hedge fund reviewing a colleague's strategy " +
    "before it's considered for capital allocation. Be specific, critical, and grounded ONLY in the data " +
    "given below - never invent numbers or facts not present. If data is missing for a section, say so " +
    "explicitly rather than guessing. Write each section as 2-5 sentences of professional analyst prose.\n\n" +
    "Strategy data:\n" + JSON.stringify(context, null, 2) + "\n\n" +
    "Return ONLY a valid JSON object with these exact keys (string values, no markdown fences, no commentary):\n" +
    JSON.stringify(Object.fromEntries(ANALYSIS_FIELDS.map((f) => [f, "string"])));

  const response = await gemini.models.generateContent({ model: GEMINI_MODEL, contents: prompt });
  const cleaned = cleanJsonResponse(response.text || "");

  let analysis;
  try {
    analysis = JSON.parse(cleaned);
  } catch {
    res.status(502);
    throw new Error("The AI response could not be parsed. Try regenerating.");
  }

  strategy.aiAnalysis = { ...analysis, generatedAt: new Date() };
  await strategy.save();
  await logTimelineEvent(strategy._id, "AI Analysis Generated", "AI Strategy Analyst review regenerated", req.user._id);

  res.json({ aiAnalysis: strategy.aiAnalysis });
});

import Strategy from "../models/Strategy.js";
import Backtest from "../models/Backtest.js";
import ResearchNote from "../models/ResearchNote.js";
import Portfolio from "../models/Portfolio.js";
import PaperAccount from "../models/PaperAccount.js";
import TimelineEvent from "../models/TimelineEvent.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getGeminiClient, GEMINI_MODEL } from "../config/gemini.js";

// POST /api/assistant/chat
// Body: { message: string, conversationHistory?: [{ role, content }] }
//
// Builds a compact knowledge context from the user's actual lab data (all
// strategies + their best backtest metrics, active portfolios, recent
// timeline events) so Gemini can answer questions grounded in real numbers.
// The context is serialized into the system prompt rather than using
// function calling, which keeps it simple and avoids SDK differences.
export const chat = asyncHandler(async (req, res) => {
  const { message, conversationHistory = [] } = req.body;
  if (!message?.trim()) {
    res.status(400);
    throw new Error("A message is required");
  }

  const gemini = getGeminiClient();
  if (!gemini) {
    res.status(503);
    throw new Error("GEMINI_API_KEY is not configured on the server. Add it to server/.env to enable the AI Quant Assistant.");
  }

  // ── Build the knowledge context ────────────────────────────────────────────
  const userId = req.user._id;

  const [strategies, portfolios, recentTimeline] = await Promise.all([
    Strategy.find().populate("indicators", "name").sort({ updatedAt: -1 }).limit(50),
    Portfolio.find({ owner: userId }).populate("constituents.strategy", "name").limit(10),
    TimelineEvent.find().sort({ createdAt: -1 }).limit(30).populate("strategy", "name"),
  ]);

  const strategyIds = strategies.map((s) => s._id);
  const backtests = await Backtest.find({ strategy: { $in: strategyIds } }).sort({ createdAt: -1 });
  const latestBacktestByStrategy = {};
  backtests.forEach((b) => {
    const key = String(b.strategy);
    if (!latestBacktestByStrategy[key]) latestBacktestByStrategy[key] = b;
  });

  const recentNotes = await ResearchNote.find().sort({ createdAt: -1 }).limit(20).populate("strategy", "name");

  const strategyContext = strategies.map((s) => {
    const bt = latestBacktestByStrategy[String(s._id)];
    return {
      id: s._id, name: s.name, type: s.strategyType,
      maturity: s.maturityStage, grade: s.scorecard?.grade,
      researchScore: s.researchScore,
      winRate: bt?.metrics?.winRate, profitFactor: bt?.metrics?.profitFactor,
      sharpe: bt?.metrics?.sharpeRatio, maxDD: bt?.metrics?.maxDrawdown,
      expectancy: bt?.metrics?.expectancy, symbol: bt?.symbol,
      marketPhase: bt?.marketPhase, tags: s.tags,
    };
  });

  const context = {
    totalStrategies: strategies.length,
    strategies: strategyContext,
    portfolios: portfolios.map((p) => ({ name: p.name, constituents: p.constituents.length, method: p.allocationMethod, capital: p.totalCapital })),
    recentActivity: recentTimeline.map((e) => ({ type: e.type, message: e.message, strategy: e.strategy?.name, date: e.createdAt })),
    recentResearch: recentNotes.map((n) => ({ type: n.type, title: n.title, strategy: n.strategy?.name, date: n.createdAt })),
  };

  const systemPrompt =
    "You are the Priyadarshi Quant Lab AI Assistant — a professional quantitative research analyst embedded in a personal algorithmic trading research platform. " +
    "Answer questions using ONLY the data provided below about the user's actual strategies, backtests, portfolios, and research notes. " +
    "Be specific and direct. Cite strategy names and numbers when available. " +
    "If the data doesn't contain the answer, say so clearly rather than guessing.\n\n" +
    "Current Lab Data:\n" + JSON.stringify(context, null, 2);

  // Build the Gemini contents array from conversation history + new message
  const contents = [
    ...conversationHistory.map((h) => ({ role: h.role === "assistant" ? "model" : "user", parts: [{ text: h.content }] })),
    { role: "user", parts: [{ text: message }] },
  ];

  // Prepend the system context as the first turn if this is a fresh conversation
  const allContents = conversationHistory.length
    ? contents
    : [{ role: "user", parts: [{ text: systemPrompt + "\n\nUser: " + message }] }];

  const response = await gemini.models.generateContent({
    model: GEMINI_MODEL,
    contents: allContents,
  });

  const reply = response.text?.trim() || "I could not generate a response. Please try again.";
  res.json({ reply });
});

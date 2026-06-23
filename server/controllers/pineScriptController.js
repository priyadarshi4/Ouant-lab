import Strategy from "../models/Strategy.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getGeminiClient, GEMINI_MODEL, cleanJsonResponse } from "../config/gemini.js";
import { logTimelineEvent } from "./timelineController.js";

const EXTRACTION_FIELDS = [
  "indicators", "parameters", "entryConditions", "exitConditions", "riskManagement",
  "positionSizing", "timeframes", "marketType", "plainEnglishExplanation",
  "tradingHypothesis", "expectedEdge", "possibleWeaknesses", "suggestedImprovements",
];

// POST /api/pine/analyze
// Body: { code: string, strategyId?: string, codeVersionId?: string }
// Parses the Pine Script with Gemini and returns a structured breakdown.
// If strategyId is provided, also saves the analysis onto the strategy
// (without overwriting its documentation - that happens only via /apply).
export const analyzePineScript = asyncHandler(async (req, res) => {
  const { code, strategyId, codeVersionId } = req.body;
  if (!code || code.trim().length < 10) {
    res.status(400);
    throw new Error("Paste a Pine Script to analyze");
  }

  const gemini = getGeminiClient();
  if (!gemini) {
    res.status(503);
    throw new Error("GEMINI_API_KEY is not configured on the server. Add it to server/.env to enable the Pine Script Intelligence Engine.");
  }

  const prompt =
    "You are a Pine Script expert and quantitative researcher. Analyze the following Pine Script strategy/indicator code.\n\n" +
    "```\n" + code.slice(0, 8000) + "\n```\n\n" +
    "Extract and explain it. Return ONLY a valid JSON object with these exact keys, no markdown fences, no commentary:\n" +
    JSON.stringify({
      indicators: ["array of indicator names used, e.g. RSI(2), EMA(200)"],
      parameters: "string summarizing key input parameters and their default values",
      entryConditions: "string describing long/short entry logic in plain terms",
      exitConditions: "string describing exit/stop logic in plain terms",
      riskManagement: "string describing any stop loss, position sizing, or risk logic found in the code",
      positionSizing: "string describing how position size is determined, or 'Not specified in code' if absent",
      timeframes: "string - timeframe the script appears designed for, or 'Not specified' if it works on any",
      marketType: "string - what market/instrument type this looks designed for (equities, futures, crypto, forex, any)",
      plainEnglishExplanation: "2-4 sentence plain English explanation of what this script does",
      tradingHypothesis: "1-2 sentence inferred hypothesis about why this strategy might work",
      expectedEdge: "1-2 sentence inferred market inefficiency or edge being exploited",
      possibleWeaknesses: "2-3 sentence critique of likely weaknesses or failure modes",
      suggestedImprovements: "2-3 sentence suggestions for improving the script",
    });

  const response = await gemini.models.generateContent({ model: GEMINI_MODEL, contents: prompt });
  const cleaned = cleanJsonResponse(response.text || "");

  let analysis;
  try {
    analysis = JSON.parse(cleaned);
  } catch {
    res.status(502);
    throw new Error("The AI response could not be parsed. Try again, or with a shorter script.");
  }

  if (strategyId) {
    const strategy = await Strategy.findById(strategyId);
    if (strategy) {
      strategy.pineScriptAnalysis = {
        ...analysis,
        sourceCodeVersion: codeVersionId || undefined,
        appliedToStrategy: false,
        generatedAt: new Date(),
      };
      await strategy.save();
      await logTimelineEvent(strategyId, "Pine Script Analyzed", "Pine Script Intelligence Engine ran on uploaded code", req.user._id);
    }
  }

  res.json({ analysis });
});

// POST /api/pine/apply
// Body: { strategyId }
// Takes the strategy's last-saved pineScriptAnalysis and writes it into
// the strategy's actual documentation/entry/exit/risk fields - this is
// the "auto-populate strategy fields" step, kept as an explicit opt-in
// action so AI extraction never silently overwrites a user's own writing.
export const applyPineScriptAnalysis = asyncHandler(async (req, res) => {
  const { strategyId } = req.body;
  const strategy = await Strategy.findById(strategyId);
  if (!strategy) {
    res.status(404);
    throw new Error("Strategy not found");
  }
  const a = strategy.pineScriptAnalysis;
  if (!a || !a.generatedAt) {
    res.status(422);
    throw new Error("No Pine Script analysis found for this strategy yet. Run the analyzer first.");
  }

  strategy.documentation = strategy.documentation || {};
  strategy.documentation.coreIdea = strategy.documentation.coreIdea || a.plainEnglishExplanation;
  strategy.documentation.hypothesis = strategy.documentation.hypothesis || a.tradingHypothesis;
  strategy.documentation.edgeExplanation = strategy.documentation.edgeExplanation || a.expectedEdge;
  strategy.documentation.whenItFails = strategy.documentation.whenItFails || a.possibleWeaknesses;

  strategy.entryConditions = strategy.entryConditions || {};
  strategy.entryConditions.longEntryRules = strategy.entryConditions.longEntryRules || a.entryConditions;

  strategy.exitConditions = strategy.exitConditions || {};
  strategy.exitConditions.stopLossLogic = strategy.exitConditions.stopLossLogic || a.exitConditions;

  strategy.riskManagement = strategy.riskManagement || {};
  strategy.riskManagement.positionSizingFormula = strategy.riskManagement.positionSizingFormula || a.positionSizing;

  strategy.pineScriptAnalysis.appliedToStrategy = true;
  await strategy.save();

  res.json({ strategy });
});

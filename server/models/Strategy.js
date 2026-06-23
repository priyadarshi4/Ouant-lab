import mongoose from "mongoose";

const scorecardSchema = new mongoose.Schema(
  {
    profitabilityScore: { type: Number, min: 0, max: 100, default: 0 },
    robustnessScore: { type: Number, min: 0, max: 100, default: 0 },
    consistencyScore: { type: Number, min: 0, max: 100, default: 0 },
    riskScore: { type: Number, min: 0, max: 100, default: 0 },
    complexityScore: { type: Number, min: 0, max: 100, default: 0 },
    finalQuantScore: { type: Number, min: 0, max: 100, default: 0 },
    grade: { type: String, enum: ["A+", "A", "B", "C", "D", "Unrated"], default: "Unrated" },
  },
  { _id: false }
);

const formulaSchema = new mongoose.Schema(
  {
    label: { type: String, required: true }, // e.g. "Position Sizing Formula"
    latex: { type: String, required: true }, // raw LaTeX, rendered client-side with KaTeX
    note: { type: String, default: "" },
  },
  { _id: true }
);

// AI Strategy Analyst output - a full professional-quant-style review,
// regenerated on demand from the strategy's current documentation,
// latest backtest, and research notes.
const aiAnalysisSchema = new mongoose.Schema(
  {
    executiveSummary: String,
    strengths: String,
    weaknesses: String,
    riskAssessment: String,
    failureRegimes: String,
    robustnessAnalysis: String,
    overfittingAssessment: String,
    marketSuitability: String,
    positionSizingSuggestions: String,
    portfolioSuitability: String,
    potentialImprovements: String,
    expectedFutureRisks: String,
    generatedAt: Date,
  },
  { _id: false }
);

// Pine Script Intelligence Engine output - structured extraction from a
// pasted Pine Script, plus an "applied" flag so the UI knows whether the
// extraction has been used to auto-fill the strategy's fields yet.
const pineScriptAnalysisSchema = new mongoose.Schema(
  {
    indicators: [String],
    parameters: String,
    entryConditions: String,
    exitConditions: String,
    riskManagement: String,
    positionSizing: String,
    timeframes: String,
    marketType: String,
    plainEnglishExplanation: String,
    tradingHypothesis: String,
    expectedEdge: String,
    possibleWeaknesses: String,
    suggestedImprovements: String,
    sourceCodeVersion: { type: mongoose.Schema.Types.ObjectId, ref: "CodeVersion" },
    appliedToStrategy: { type: Boolean, default: false },
    generatedAt: Date,
  },
  { _id: false }
);

const strategySchema = new mongoose.Schema(
  {
    // --- Basic Information ---
    name: { type: String, required: true, trim: true },
    strategyType: {
      type: String,
      enum: ["Trend Following", "Mean Reversion", "Breakout", "Momentum", "Volatility", "Arbitrage", "Hybrid"],
      required: true,
    },
    version: { type: String, default: "v1.0" },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["Draft", "Testing", "Live", "Archived"], default: "Draft" },
    tags: [{ type: String, trim: true }],
    description: { type: String, default: "" },
    coverImageUrl: { type: String, default: "" },

    // --- Research paper framing sections ---
    executiveSummary: { type: String, default: "" },
    failureConditions: { type: String, default: "" },
    marketRegimes: { type: String, default: "" },
    conclusion: { type: String, default: "" },

    // --- Mathematical Framework (KaTeX-rendered formulas) ---
    mathematicalFramework: { type: [formulaSchema], default: [] },

    // --- Research maturity score (auto-derived from documentation completeness) ---
    researchScore: { type: Number, min: 0, max: 100, default: 0 },

    // --- Core Strategy Documentation ---
    documentation: {
      coreIdea: String,
      philosophy: String,
      hypothesis: String,
      marketLogic: String,
      marketInefficiencyExploited: String,
      edgeExplanation: String,
      whyItShouldWork: String,
      whenItWorks: String,
      whenItFails: String,
      marketConditions: String,
      behaviorDuringCrashes: String,
      behaviorDuringBullMarkets: String,
      behaviorDuringSidewaysMarkets: String,
      riskAssumptions: String,
      expectedOutcomes: String,
    },

    // --- Entry Conditions ---
    entryConditions: {
      longEntryRules: String,
      shortEntryRules: String,
      indicatorConditions: String,
      priceActionConditions: String,
      volumeConditions: String,
      volatilityConditions: String,
      filters: String,
      confirmationRules: String,
    },

    // --- Exit Conditions ---
    exitConditions: {
      longExitRules: String,
      shortExitRules: String,
      takeProfitLogic: String,
      stopLossLogic: String,
      timeBasedExit: String,
      volatilityExit: String,
      emergencyExit: String,
    },

    // --- Risk Management ---
    riskManagement: {
      riskPerTrade: String,
      positionSizingFormula: String,
      maxDrawdownAllowed: String,
      maxExposure: String,
      leverageRules: String,
      portfolioAllocationRules: String,
      dailyLossLimit: String,
      weeklyLossLimit: String,
      monthlyLossLimit: String,
      riskOfRuin: String,
    },

    // --- Trailing Stop System ---
    trailingStop: {
      logicType: { type: String, enum: ["ATR Based", "Percentage Based", "Structure Based", "Chandelier Exit", "Custom Formula", "None"], default: "None" },
      customFormula: String,
      notes: String,
    },

    // --- Relations ---
    indicators: [{ type: mongoose.Schema.Types.ObjectId, ref: "Indicator" }],
    codeVersions: [{ type: mongoose.Schema.Types.ObjectId, ref: "CodeVersion" }],

    scorecard: { type: scorecardSchema, default: () => ({}) },

    // --- Strategy Maturity Engine (auto-classified, data-driven) ---
    maturityStage: {
      type: String,
      enum: ["Idea", "Prototype", "Backtested", "Validated", "Walk Forward Tested", "Paper Trading", "Live Candidate", "Live Ready"],
      default: "Idea",
    },

    aiAnalysis: { type: aiAnalysisSchema, default: () => ({}) },
    pineScriptAnalysis: { type: pineScriptAnalysisSchema, default: () => ({}) },

    isFavorite: { type: Boolean, default: false },
  },
  { timestamps: true }
);

strategySchema.index({ name: "text", description: "text", tags: "text" });

// Research maturity score: rewards a fully fleshed-out research record
// (documentation depth, math framework, code, backtests) rather than
// raw performance — a thin strategy with great luck still scores low here.
strategySchema.methods.computeResearchScore = function (codeVersionCount = 0, backtestCount = 0, attachmentCount = 0) {
  const docFields = Object.values(this.documentation?.toObject?.() || this.documentation || {});
  const filledDocFields = docFields.filter((v) => v && String(v).trim().length > 10).length;
  const docScore = Math.min(40, (filledDocFields / 15) * 40);

  const sectionFields = [this.executiveSummary, this.failureConditions, this.marketRegimes, this.conclusion];
  const filledSections = sectionFields.filter((v) => v && v.trim().length > 10).length;
  const sectionScore = Math.min(15, (filledSections / 4) * 15);

  const mathScore = Math.min(15, (this.mathematicalFramework?.length || 0) * 5);
  const codeScore = Math.min(10, codeVersionCount * 5);
  const backtestScore = Math.min(15, backtestCount * 5);
  const mediaScore = Math.min(5, attachmentCount * 1);

  this.researchScore = Math.round(docScore + sectionScore + mathScore + codeScore + backtestScore + mediaScore);
  return this.researchScore;
};

// Strategy Maturity Engine - classifies the strategy's lifecycle stage from
// objective signals only (never set manually). Each stage requires the
// previous stage's conditions plus one more piece of concrete evidence.
// `ctx` is gathered by the controller from related collections:
//   { hasCode, backtestCount, bestBacktest, hasWalkForward,
//     paperTradeCount, paperRealizedPnl }
strategySchema.methods.computeMaturityStage = function (ctx = {}) {
  const {
    hasCode = false,
    backtestCount = 0,
    bestBacktest = null,
    hasWalkForward = false,
    paperTradeCount = 0,
    paperRealizedPnl = 0,
  } = ctx;

  const doc = this.documentation?.toObject?.() || this.documentation || {};
  const entry = this.entryConditions?.toObject?.() || this.entryConditions || {};
  const hasCoreThesis = !!(doc.coreIdea?.trim().length > 10 && doc.hypothesis?.trim().length > 10);
  const hasEntryLogic = !!(entry.longEntryRules?.trim().length > 5 || entry.shortEntryRules?.trim().length > 5);
  const hasBacktest = backtestCount > 0 && (bestBacktest?.metrics?.totalTrades || 0) > 0;
  const isValidated = backtestCount >= 2 && (this.researchScore || 0) >= 50;
  const isPaperTrading = paperTradeCount > 0;
  const isLiveCandidate = paperTradeCount >= 20 && paperRealizedPnl > 0;
  const isLiveReady = isLiveCandidate && hasWalkForward && this.status === "Live";

  let stage = "Idea";
  if (hasCoreThesis && hasEntryLogic && (hasCode || (this.indicators?.length || 0) > 0)) stage = "Prototype";
  if (stage === "Prototype" && hasBacktest) stage = "Backtested";
  if (stage === "Backtested" && isValidated) stage = "Validated";
  if (stage === "Validated" && hasWalkForward) stage = "Walk Forward Tested";
  if (stage === "Walk Forward Tested" && isPaperTrading) stage = "Paper Trading";
  if (stage === "Paper Trading" && isLiveCandidate) stage = "Live Candidate";
  if (stage === "Live Candidate" && isLiveReady) stage = "Live Ready";

  this.maturityStage = stage;
  return stage;
};

export default mongoose.model("Strategy", strategySchema);

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

export default mongoose.model("Strategy", strategySchema);

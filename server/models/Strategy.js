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

export default mongoose.model("Strategy", strategySchema);

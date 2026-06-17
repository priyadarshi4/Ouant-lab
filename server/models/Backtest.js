import mongoose from "mongoose";

const metricsSchema = new mongoose.Schema(
  {
    // --- Performance Summary ---
    netProfit: Number,
    grossProfit: Number,
    grossLoss: Number,
    buyAndHoldReturn: Number,
    maxRunup: Number,
    maxDrawdown: Number,
    profitFactor: Number,
    winRate: Number,
    sharpeRatio: Number,
    sortinoRatio: Number,
    calmarRatio: Number,
    recoveryFactor: Number,
    expectancy: Number,
    averageTrade: Number,
    averageWin: Number,
    averageLoss: Number,
    largestWin: Number,
    largestLoss: Number,

    // --- Trade Statistics ---
    totalTrades: Number,
    winningTrades: Number,
    losingTrades: Number,
    longTrades: Number,
    shortTrades: Number,
    longWinRate: Number,
    shortWinRate: Number,
    averageBarsInTrade: Number,
    averageHoldingTime: String,
    averageHoldingDays: Number,
    averageHoldingHours: Number,
    consecutiveWins: Number,
    consecutiveLosses: Number,
    largestWinStreak: Number,
    largestLossStreak: Number,
  },
  { _id: false }
);

const monteCarloSchema = new mongoose.Schema(
  {
    iterations: Number,
    worstCase: Number,
    bestCase: Number,
    medianCase: Number,
    confidenceIntervalLower: Number,
    confidenceIntervalUpper: Number,
  },
  { _id: false }
);

const walkForwardSchema = new mongoose.Schema(
  {
    inSampleResults: String,
    outOfSampleResults: String,
    validationReport: String,
    optimizationResults: String,
  },
  { _id: false }
);

const backtestSchema = new mongoose.Schema(
  {
    strategy: { type: mongoose.Schema.Types.ObjectId, ref: "Strategy", required: true },

    // --- Setup / Date Information ---
    exchange: String,
    symbol: { type: String, required: true },
    index: String,
    sector: String,
    timeframe: { type: String, required: true },
    dateRangeStart: Date,
    dateRangeEnd: Date,
    marketPhase: { type: String, enum: ["Bull", "Bear", "Sideways", "Mixed", "Unspecified"], default: "Unspecified" },
    dataSource: String,
    initialCapital: Number,
    commission: Number,
    slippage: Number,
    positionSize: String,
    positionSizingMethod: String,

    // --- Metrics ---
    metrics: { type: metricsSchema, default: () => ({}) },

    // --- Equity curve raw data points [{t, equity, drawdown}] ---
    equityCurve: [{ t: Date, equity: Number, drawdown: Number, benchmarkEquity: Number }],

    // --- Return series for heatmap / yearly chart / rolling metrics ---
    monthlyReturns: [{ month: String, returnPct: Number }], // month e.g. "2024-03"
    yearlyReturns: [{ year: String, returnPct: Number }],
    rollingMetrics: [{ t: Date, rollingSharpe: Number, rollingProfitFactor: Number, rollingDrawdown: Number }],

    monteCarlo: { type: monteCarloSchema, default: () => ({}) },
    walkForward: { type: walkForwardSchema, default: () => ({}) },

    chartAttachments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Attachment" }],

    notes: String,
  },
  { timestamps: true }
);

export default mongoose.model("Backtest", backtestSchema);

import mongoose from "mongoose";

const metricsSchema = new mongoose.Schema(
  {
    netProfit: Number,
    grossProfit: Number,
    grossLoss: Number,
    profitFactor: Number,
    winRate: Number,
    sharpeRatio: Number,
    sortinoRatio: Number,
    calmarRatio: Number,
    maxDrawdown: Number,
    averageTrade: Number,
    averageWin: Number,
    averageLoss: Number,
    largestWin: Number,
    largestLoss: Number,
    recoveryFactor: Number,
    expectancy: Number,
    totalTrades: Number,
    longTrades: Number,
    shortTrades: Number,
    winningTrades: Number,
    losingTrades: Number,
    averageHoldingTime: String,
    averageBarsInTrade: Number,
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

    // --- Setup ---
    exchange: String,
    symbol: { type: String, required: true },
    index: String,
    sector: String,
    timeframe: { type: String, required: true },
    dateRangeStart: Date,
    dateRangeEnd: Date,
    initialCapital: Number,
    commission: Number,
    slippage: Number,
    positionSize: String,

    // --- Metrics ---
    metrics: { type: metricsSchema, default: () => ({}) },

    // --- Equity curve raw data points [{t, equity, drawdown}] ---
    equityCurve: [{ t: Date, equity: Number, drawdown: Number, benchmarkEquity: Number }],

    monteCarlo: { type: monteCarloSchema, default: () => ({}) },
    walkForward: { type: walkForwardSchema, default: () => ({}) },

    chartAttachments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Attachment" }],

    notes: String,
  },
  { timestamps: true }
);

export default mongoose.model("Backtest", backtestSchema);

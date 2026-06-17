import mongoose from "mongoose";

const performanceMetricSchema = new mongoose.Schema(
  {
    strategy: { type: mongoose.Schema.Types.ObjectId, ref: "Strategy", required: true },
    backtest: { type: mongoose.Schema.Types.ObjectId, ref: "Backtest" },
    periodLabel: String, // e.g. "2024-01", "Q1 2024"
    returnPct: Number,
    drawdownPct: Number,
    volatility: Number,
    correlationToNifty: Number,
    correlationToBankNifty: Number,
  },
  { timestamps: true }
);

export default mongoose.model("PerformanceMetric", performanceMetricSchema);

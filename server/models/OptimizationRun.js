import mongoose from "mongoose";

const optimizationResultSchema = new mongoose.Schema(
  {
    params: { type: mongoose.Schema.Types.Mixed, required: true }, // e.g. { rsiLength: 2, rsiThreshold: 10 }
    metrics: {
      netProfit: Number,
      profitFactor: Number,
      winRate: Number,
      sharpeRatio: Number,
      maxDrawdown: Number,
      totalTrades: Number,
    },
  },
  { _id: false }
);

const optimizationRunSchema = new mongoose.Schema(
  {
    strategy: { type: mongoose.Schema.Types.ObjectId, ref: "Strategy", required: true, index: true },
    name: { type: String, required: true },
    paramAxisX: { type: String, required: true }, // name of the swept parameter shown on the X axis
    paramAxisY: { type: String, default: "" }, // optional second swept parameter, for surface/heatmap views
    results: { type: [optimizationResultSchema], default: [] },
    stabilityScore: { type: Number, min: 0, max: 100 }, // computed: how consistent metrics are across neighboring params
    aiInterpretation: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("OptimizationRun", optimizationRunSchema);

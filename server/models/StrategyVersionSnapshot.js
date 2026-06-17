import mongoose from "mongoose";

const strategyVersionSnapshotSchema = new mongoose.Schema(
  {
    strategy: { type: mongoose.Schema.Types.ObjectId, ref: "Strategy", required: true },
    versionLabel: { type: String, required: true }, // the strategy's `version` field at snapshot time
    snapshot: { type: mongoose.Schema.Types.Mixed, required: true }, // full strategy doc at time of change
    changeLog: { type: String, default: "" },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("StrategyVersionSnapshot", strategyVersionSnapshotSchema);

import mongoose from "mongoose";

const timelineEventSchema = new mongoose.Schema(
  {
    strategy: { type: mongoose.Schema.Types.ObjectId, ref: "Strategy", required: true, index: true },
    type: {
      type: String,
      enum: [
        "Strategy Created", "Description Updated", "Code Uploaded", "Backtest Added",
        "Optimization Run", "Monte Carlo Run", "Walk Forward Run", "Report Generated",
        "AI Analysis Generated", "Pine Script Analyzed", "Paper Trading Started",
        "Paper Trading Stopped", "Portfolio Added", "Research Note Added",
        "Task Created", "Task Completed", "Maturity Stage Changed", "Rollback",
      ],
      required: true,
    },
    message: { type: String, required: true },
    meta: { type: mongoose.Schema.Types.Mixed },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

timelineEventSchema.index({ strategy: 1, createdAt: -1 });

export default mongoose.model("TimelineEvent", timelineEventSchema);

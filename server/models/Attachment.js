import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  {
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    relatedStrategy: { type: mongoose.Schema.Types.ObjectId, ref: "Strategy" },
    relatedBacktest: { type: mongoose.Schema.Types.ObjectId, ref: "Backtest" },
    relatedResearchNote: { type: mongoose.Schema.Types.ObjectId, ref: "ResearchNote" },
    fileType: { type: String, enum: ["image", "pdf", "csv", "other"], default: "other" },
    category: {
      type: String,
      enum: [
        "Equity Curve", "Drawdown Curve", "Distribution Graph", "Trade Analysis",
        "Monte Carlo Analysis", "Walk Forward Results", "Research Attachment", "Other",
      ],
      default: "Other",
    },
    originalName: String,
    url: { type: String, required: true },
    cloudinaryPublicId: String,
  },
  { timestamps: true }
);

export default mongoose.model("Attachment", attachmentSchema);

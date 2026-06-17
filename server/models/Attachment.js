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
        // Strategy media
        "Strategy Diagram", "Market Structure Diagram", "Flowchart", "Signal Example",
        "Entry Example", "Exit Example", "Annotated Chart", "Research Note Image",
        // Backtest media
        "Equity Curve", "Drawdown Curve", "Monthly Returns", "Yearly Returns",
        "Distribution Curve", "Trade Distribution", "Monte Carlo Analysis", "Walk Forward Results",
        "Parameter Sensitivity", "Optimization Result", "TradingView Screenshot",
        "Performance Summary Screenshot", "List of Trades Screenshot",
        // Generic / profile
        "Research Attachment", "Profile Image", "Banner Image", "Other",
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

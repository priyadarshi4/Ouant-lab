import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    strategy: { type: mongoose.Schema.Types.ObjectId, ref: "Strategy", required: true },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    format: { type: String, enum: ["PDF", "DOCX"], default: "PDF" },
    sections: {
      executiveSummary: String,
      strategyOverview: String,
      riskAnalysis: String,
      performanceAnalysis: String,
      backtestResults: String,
      strengths: String,
      weaknesses: String,
      recommendations: String,
      researchNotes: String,
      appendix: String,
    },
    fileUrl: { type: String }, // Cloudinary URL once generated
  },
  { timestamps: true }
);

export default mongoose.model("Report", reportSchema);

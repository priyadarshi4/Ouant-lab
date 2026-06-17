import mongoose from "mongoose";

const indicatorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g. "RSI(2)", "ATR(5)"
    purpose: String,
    formula: String,
    parameters: String,
    interpretation: String,
    isCustom: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("Indicator", indicatorSchema);

import mongoose from "mongoose";

const constituentSchema = new mongoose.Schema(
  {
    strategy: { type: mongoose.Schema.Types.ObjectId, ref: "Strategy", required: true },
    weight: { type: Number, required: true, min: 0, max: 1 }, // fraction of capital, sums to ~1 across constituents
    contracts: { type: Number, default: 1 },
  },
  { _id: false }
);

const portfolioSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    constituents: { type: [constituentSchema], default: [] },
    totalCapital: { type: Number, default: 100000 },
    allocationMethod: {
      type: String,
      enum: ["Equal Weight", "Risk Parity", "Volatility Targeting", "Kelly", "Half Kelly", "Custom"],
      default: "Equal Weight",
    },
    targetVolatility: { type: Number, default: 15 },
  },
  { timestamps: true }
);

export default mongoose.model("Portfolio", portfolioSchema);

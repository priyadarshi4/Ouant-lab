import mongoose from "mongoose";

const signalSchema = new mongoose.Schema(
  {
    paperAccount: { type: mongoose.Schema.Types.ObjectId, ref: "PaperAccount", required: true, index: true },
    strategy: { type: mongoose.Schema.Types.ObjectId, ref: "Strategy" },
    timestamp: { type: Date, default: Date.now },
    market: { type: String, required: true },
    direction: { type: String, enum: ["long", "short", "close", "flat"], required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, default: 1 },
    signalType: { type: String, default: "entry" },
    orderType: { type: String, enum: ["market", "limit", "stop", "stop_limit"], default: "market" },
    rawPayload: { type: mongoose.Schema.Types.Mixed },
    status: { type: String, enum: ["routed", "blocked"], default: "routed" },
    blockReason: { type: String },
  },
  { timestamps: true }
);

signalSchema.index({ paperAccount: 1, timestamp: -1 });

export default mongoose.model("Signal", signalSchema);

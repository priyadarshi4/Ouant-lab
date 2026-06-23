import mongoose from "mongoose";

const tradeJournalEntrySchema = new mongoose.Schema(
  {
    paperAccount: { type: mongoose.Schema.Types.ObjectId, ref: "PaperAccount", required: true, index: true },
    closedTradeId: { type: mongoose.Schema.Types.ObjectId }, // references a subdocument _id inside PaperAccount.closedTrades
    strategy: { type: mongoose.Schema.Types.ObjectId, ref: "Strategy" },

    market: String,
    direction: { type: String, enum: ["long", "short"] },
    entryPrice: Number,
    exitPrice: Number,
    pnl: Number,

    reason: { type: String, default: "" },
    notes: { type: String, default: "" },
    mistakes: { type: String, default: "" },
    lessonsLearned: { type: String, default: "" },
    emotion: {
      type: String,
      enum: ["Confident", "Anxious", "FOMO", "Disciplined", "Impulsive", "Neutral", "Frustrated", "Relieved"],
      default: "Neutral",
    },
    tags: [{ type: String, trim: true }],
    attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Attachment" }],

    aiReview: { type: String, default: "" },

    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model("TradeJournalEntry", tradeJournalEntrySchema);

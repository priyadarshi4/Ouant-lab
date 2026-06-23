import mongoose from "mongoose";
import crypto from "crypto";

const positionSchema = new mongoose.Schema(
  {
    market: { type: String, required: true },
    direction: { type: String, enum: ["long", "short"], required: true },
    quantity: { type: Number, required: true },
    avgPrice: { type: Number, required: true },
    openedAt: { type: Date, default: Date.now },
    fills: [{ price: Number, quantity: Number, t: Date }],
  },
  { _id: true }
);

const closedTradeSchema = new mongoose.Schema(
  {
    market: String,
    direction: { type: String, enum: ["long", "short"] },
    quantity: Number,
    entryPrice: Number,
    exitPrice: Number,
    openedAt: Date,
    closedAt: Date,
    pnl: Number,
    commission: Number,
    slippageCost: Number,
  },
  { _id: true }
);

const riskLimitsSchema = new mongoose.Schema(
  {
    dailyLossLimit: { type: Number },
    weeklyLossLimit: { type: Number },
    monthlyLossLimit: { type: Number },
    maxPositionSize: { type: Number },
    maxPortfolioExposure: { type: Number },
  },
  { _id: false }
);

const paperAccountSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    strategy: { type: mongoose.Schema.Types.ObjectId, ref: "Strategy" },
    portfolio: { type: mongoose.Schema.Types.ObjectId, ref: "Portfolio" },

    initialCapital: { type: Number, default: 100000 },
    capital: { type: Number, default: 100000 },
    equity: { type: Number, default: 100000 },
    peakEquity: { type: Number, default: 100000 },

    commissionPerContract: { type: Number, default: 2.5 },
    slippageTicks: { type: Number, default: 1 },
    tickValue: { type: Number, default: 1 },

    positions: { type: [positionSchema], default: [] },
    closedTrades: { type: [closedTradeSchema], default: [] },

    realizedPnl: { type: Number, default: 0 },
    unrealizedPnl: { type: Number, default: 0 },

    riskLimits: { type: riskLimitsSchema, default: () => ({}) },

    status: { type: String, enum: ["active", "stopped"], default: "active" },
    webhookToken: { type: String, unique: true, default: () => crypto.randomBytes(16).toString("hex") },

    equityCurve: [{ t: Date, equity: Number, drawdown: Number }],
  },
  { timestamps: true }
);

paperAccountSchema.methods.markToMarket = function (priceMap = {}) {
  let unrealized = 0;
  this.positions.forEach((p) => {
    const px = priceMap[p.market];
    if (px == null) return;
    const diff = p.direction === "long" ? px - p.avgPrice : p.avgPrice - px;
    unrealized += diff * p.quantity * this.tickValue;
  });
  this.unrealizedPnl = unrealized;
  this.equity = this.capital + unrealized;
  this.peakEquity = Math.max(this.peakEquity, this.equity);
  return this.equity;
};

export default mongoose.model("PaperAccount", paperAccountSchema);

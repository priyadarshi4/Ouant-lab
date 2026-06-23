import PaperAccount from "../models/PaperAccount.js";
import Signal from "../models/Signal.js";
import TradeJournalEntry from "../models/TradeJournalEntry.js";
import asyncHandler from "../utils/asyncHandler.js";
import { recomputeStrategyDerivedFields } from "../utils/recomputeStrategy.js";
import { logTimelineEvent } from "./timelineController.js";

// ─── Account CRUD ─────────────────────────────────────────────────────────────

export const getPaperAccounts = asyncHandler(async (req, res) => {
  const accounts = await PaperAccount.find({ owner: req.user._id })
    .populate("strategy", "name strategyType")
    .sort({ updatedAt: -1 });
  res.json({ count: accounts.length, accounts });
});

export const getPaperAccountById = asyncHandler(async (req, res) => {
  const account = await PaperAccount.findById(req.params.id).populate("strategy", "name strategyType");
  if (!account || String(account.owner) !== String(req.user._id)) {
    res.status(404); throw new Error("Paper account not found");
  }
  res.json({ account });
});

export const createPaperAccount = asyncHandler(async (req, res) => {
  const account = await PaperAccount.create({ ...req.body, owner: req.user._id, capital: req.body.initialCapital || 100000, equity: req.body.initialCapital || 100000, peakEquity: req.body.initialCapital || 100000 });
  if (account.strategy) {
    await logTimelineEvent(account.strategy, "Paper Trading Started", `Paper account "${account.name}" created`, req.user._id);
  }
  res.status(201).json({ account });
});

export const updatePaperAccount = asyncHandler(async (req, res) => {
  const account = await PaperAccount.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!account) { res.status(404); throw new Error("Paper account not found"); }
  res.json({ account });
});

export const deletePaperAccount = asyncHandler(async (req, res) => {
  const account = await PaperAccount.findByIdAndDelete(req.params.id);
  if (!account) { res.status(404); throw new Error("Paper account not found"); }
  if (account.strategy) {
    await logTimelineEvent(account.strategy, "Paper Trading Stopped", `Paper account "${account.name}" deleted`, req.user._id);
    await recomputeStrategyDerivedFields(account.strategy);
  }
  res.json({ message: "Paper account deleted" });
});

// ─── Risk Check ───────────────────────────────────────────────────────────────

function checkRiskLimits(account) {
  const limits = account.riskLimits || {};
  const now = new Date();

  if (limits.dailyLossLimit != null) {
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayLoss = account.closedTrades
      .filter((t) => t.closedAt >= todayStart && t.pnl < 0)
      .reduce((sum, t) => sum + Math.abs(t.pnl), 0);
    if (todayLoss >= limits.dailyLossLimit) return `Daily loss limit (${limits.dailyLossLimit}) reached`;
  }
  if (limits.weeklyLossLimit != null) {
    const weekStart = new Date(now); weekStart.setDate(weekStart.getDate() - weekStart.getDay()); weekStart.setHours(0, 0, 0, 0);
    const weekLoss = account.closedTrades
      .filter((t) => t.closedAt >= weekStart && t.pnl < 0)
      .reduce((sum, t) => sum + Math.abs(t.pnl), 0);
    if (weekLoss >= limits.weeklyLossLimit) return `Weekly loss limit (${limits.weeklyLossLimit}) reached`;
  }
  if (limits.monthlyLossLimit != null) {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthLoss = account.closedTrades
      .filter((t) => t.closedAt >= monthStart && t.pnl < 0)
      .reduce((sum, t) => sum + Math.abs(t.pnl), 0);
    if (monthLoss >= limits.monthlyLossLimit) return `Monthly loss limit (${limits.monthlyLossLimit}) reached`;
  }
  const totalExposure = account.positions.reduce((sum, p) => sum + p.quantity * p.avgPrice, 0);
  if (limits.maxPortfolioExposure != null && totalExposure >= limits.maxPortfolioExposure) {
    return `Max portfolio exposure (${limits.maxPortfolioExposure}) reached`;
  }
  return null;
}

// ─── Signal Processor (the heart of the execution engine) ────────────────────

function applySlippage(price, direction, slippageTicks, tickValue) {
  // Slippage is adverse: buys fill higher, sells fill lower.
  const slippageCost = (slippageTicks * tickValue) || 0;
  return direction === "long" ? price + slippageCost : price - slippageCost;
}

async function processSignal(account, payload) {
  const { market, direction, price: rawPrice, quantity = 1, signalType = "entry", strategy } = payload;

  // Risk gate
  const limitViolation = checkRiskLimits(account);
  if (limitViolation) {
    const sig = await Signal.create({ paperAccount: account._id, strategy, market, direction, price: rawPrice, quantity, signalType, status: "blocked", blockReason: limitViolation, rawPayload: payload });
    return { blocked: true, reason: limitViolation, signal: sig };
  }

  const price = applySlippage(rawPrice, direction, account.slippageTicks, account.tickValue);
  const commission = account.commissionPerContract * quantity;

  let pnl = 0;
  let closedTrade = null;

  if (direction === "close" || direction === "flat") {
    // Close all positions in this market
    const toClose = account.positions.filter((p) => p.market === market);
    toClose.forEach((pos) => {
      const diff = pos.direction === "long" ? price - pos.avgPrice : pos.avgPrice - price;
      const tradePnl = diff * pos.quantity * account.tickValue - commission;
      pnl += tradePnl;
      closedTrade = {
        market: pos.market, direction: pos.direction, quantity: pos.quantity,
        entryPrice: pos.avgPrice, exitPrice: price,
        openedAt: pos.openedAt, closedAt: new Date(),
        pnl: Number(tradePnl.toFixed(2)),
        commission: Number(commission.toFixed(2)),
        slippageCost: Number(((account.slippageTicks * account.tickValue) * pos.quantity).toFixed(2)),
      };
      account.closedTrades.push(closedTrade);
    });
    account.positions = account.positions.filter((p) => p.market !== market);
  } else {
    // Check if we're adding to an existing position (same market + direction = scale in)
    const existing = account.positions.find((p) => p.market === market && p.direction === direction);
    if (existing) {
      const totalQty = existing.quantity + quantity;
      existing.avgPrice = (existing.avgPrice * existing.quantity + price * quantity) / totalQty;
      existing.quantity = totalQty;
      existing.fills.push({ price, quantity, t: new Date() });
    } else {
      // Close opposite position first if exists (reversal)
      const opposite = account.positions.find((p) => p.market === market && p.direction !== direction);
      if (opposite) {
        const diff = opposite.direction === "long" ? price - opposite.avgPrice : opposite.avgPrice - price;
        const tradePnl = diff * opposite.quantity * account.tickValue - commission;
        pnl += tradePnl;
        account.closedTrades.push({
          market: opposite.market, direction: opposite.direction, quantity: opposite.quantity,
          entryPrice: opposite.avgPrice, exitPrice: price,
          openedAt: opposite.openedAt, closedAt: new Date(),
          pnl: Number(tradePnl.toFixed(2)), commission: Number(commission.toFixed(2)), slippageCost: 0,
        });
        account.positions = account.positions.filter((p) => p.market !== market || p.direction === direction);
      }
      // Open new position
      account.positions.push({ market, direction, quantity, avgPrice: price, openedAt: new Date(), fills: [{ price, quantity, t: new Date() }] });
    }
  }

  // Update capital & PnL
  account.realizedPnl += pnl;
  account.capital += pnl;
  account.equity = account.capital; // will be marked to market more precisely via MTM calls
  account.peakEquity = Math.max(account.peakEquity, account.equity);

  // Append equity curve point
  const drawdown = account.peakEquity > 0 ? ((account.equity - account.peakEquity) / account.peakEquity) * 100 : 0;
  account.equityCurve.push({ t: new Date(), equity: Math.round(account.equity * 100) / 100, drawdown: Math.round(drawdown * 100) / 100 });

  const sig = await Signal.create({ paperAccount: account._id, strategy, market, direction, price: rawPrice, quantity, signalType, status: "routed", rawPayload: payload });
  await account.save();

  // Auto-create a minimal trade journal entry for any closed trade
  if (closedTrade && strategy) {
    await TradeJournalEntry.create({
      paperAccount: account._id, closedTradeId: account.closedTrades[account.closedTrades.length - 1]._id,
      strategy, market, direction: closedTrade.direction, entryPrice: closedTrade.entryPrice,
      exitPrice: closedTrade.exitPrice, pnl: closedTrade.pnl,
      notes: "Auto-created from signal router. Add your reflection below.",
      author: account.owner,
    });
  }

  return { blocked: false, signal: sig, pnl, closedTrade };
}

// ─── Webhook endpoint (no auth - secured by token in URL) ────────────────────

// POST /api/paper/webhook/:token
// Called by TradingView alerts. The webhook token is unique per paper
// account and acts as the authentication mechanism.
// Expected payload (JSON): { market, direction, price, quantity?, signalType?, strategy? }
export const handleWebhook = async (req, res, next) => {
  try {
    const account = await PaperAccount.findOne({ webhookToken: req.params.token, status: "active" });
    if (!account) return res.status(404).json({ message: "No active paper account found for this token" });

    const result = await processSignal(account, req.body);
    if (result.blocked) {
      return res.json({ status: "blocked", reason: result.reason });
    }
    res.json({ status: "routed", signalId: result.signal._id, pnl: result.pnl });
  } catch (err) {
    next(err);
  }
};

// POST /api/paper/:id/signal  (authenticated, for manual test signals)
export const manualSignal = asyncHandler(async (req, res) => {
  const account = await PaperAccount.findById(req.params.id);
  if (!account || String(account.owner) !== String(req.user._id)) {
    res.status(404); throw new Error("Paper account not found");
  }
  const result = await processSignal(account, req.body);
  if (result.blocked) return res.json({ status: "blocked", reason: result.reason });
  res.json({ status: "routed", signalId: result.signal._id, pnl: result.pnl });
});

// ─── Mark to Market (price update from client) ───────────────────────────────

// POST /api/paper/:id/mark-to-market  body: { prices: { ES: 4500, NQ: 15000 } }
export const markToMarket = asyncHandler(async (req, res) => {
  const account = await PaperAccount.findById(req.params.id);
  if (!account || String(account.owner) !== String(req.user._id)) {
    res.status(404); throw new Error("Paper account not found");
  }
  const equity = account.markToMarket(req.body.prices || {});
  const drawdown = account.peakEquity > 0 ? ((equity - account.peakEquity) / account.peakEquity) * 100 : 0;
  account.equityCurve.push({ t: new Date(), equity: Math.round(equity * 100) / 100, drawdown: Math.round(drawdown * 100) / 100 });
  await account.save();
  res.json({ equity, unrealizedPnl: account.unrealizedPnl, drawdown: Math.round(drawdown * 100) / 100 });
});

// ─── Signal History ───────────────────────────────────────────────────────────

export const getSignals = asyncHandler(async (req, res) => {
  const account = await PaperAccount.findById(req.params.id);
  if (!account || String(account.owner) !== String(req.user._id)) {
    res.status(404); throw new Error("Paper account not found");
  }
  const signals = await Signal.find({ paperAccount: req.params.id }).sort({ timestamp: -1 }).limit(200);
  res.json({ count: signals.length, signals });
});

// ─── Trade Journal ────────────────────────────────────────────────────────────

export const getTradeJournal = asyncHandler(async (req, res) => {
  const entries = await TradeJournalEntry.find({ paperAccount: req.params.id })
    .populate("strategy", "name")
    .sort({ createdAt: -1 });
  res.json({ count: entries.length, entries });
});

export const updateTradeJournalEntry = asyncHandler(async (req, res) => {
  const entry = await TradeJournalEntry.findByIdAndUpdate(req.params.entryId, req.body, { new: true, runValidators: true });
  if (!entry) { res.status(404); throw new Error("Journal entry not found"); }
  res.json({ entry });
});

// POST /api/paper/:id/journal/:entryId/ai-review
// Asks Gemini to critique the trade and populate the aiReview field.
export const aiReviewTrade = asyncHandler(async (req, res) => {
  const { getGeminiClient, GEMINI_MODEL, cleanJsonResponse } = await import("../config/gemini.js");
  const gemini = getGeminiClient();
  if (!gemini) { res.status(503); throw new Error("GEMINI_API_KEY not configured"); }

  const entry = await TradeJournalEntry.findById(req.params.entryId);
  if (!entry) { res.status(404); throw new Error("Journal entry not found"); }

  const context = { market: entry.market, direction: entry.direction, entryPrice: entry.entryPrice, exitPrice: entry.exitPrice, pnl: entry.pnl, reason: entry.reason, notes: entry.notes, mistakes: entry.mistakes, emotion: entry.emotion, tags: entry.tags };
  const response = await gemini.models.generateContent({
    model: GEMINI_MODEL,
    contents: `You are a professional trading coach reviewing a paper trade. Be specific, honest, and constructive. Keep it to 3-5 sentences.\n\nTrade: ${JSON.stringify(context)}\n\nWrite a brief professional review of this trade's execution and decision-making.`,
  });
  entry.aiReview = response.text?.trim() || "";
  await entry.save();
  res.json({ entry });
});

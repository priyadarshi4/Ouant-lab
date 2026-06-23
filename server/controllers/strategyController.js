import Strategy from "../models/Strategy.js";
import Backtest from "../models/Backtest.js";
import CodeVersion from "../models/CodeVersion.js";
import Attachment from "../models/Attachment.js";
import StrategyVersionSnapshot from "../models/StrategyVersionSnapshot.js";
import asyncHandler from "../utils/asyncHandler.js";
import { logTimelineEvent } from "./timelineController.js";
import { recomputeStrategyDerivedFields } from "../utils/recomputeStrategy.js";

// GET /api/strategies?type=&status=&tag=&search=
export const getStrategies = asyncHandler(async (req, res) => {
  const { type, status, tag, search } = req.query;
  const filter = {};
  if (type) filter.strategyType = type;
  if (status) filter.status = status;
  if (tag) filter.tags = tag;
  if (search) filter.$text = { $search: search };

  const strategies = await Strategy.find(filter)
    .populate("author", "name email")
    .sort({ updatedAt: -1 });

  res.json({ count: strategies.length, strategies });
});

// GET /api/strategies/:id
export const getStrategyById = asyncHandler(async (req, res) => {
  const strategy = await Strategy.findById(req.params.id)
    .populate("author", "name email")
    .populate("indicators")
    .populate("codeVersions");
  if (!strategy) {
    res.status(404);
    throw new Error("Strategy not found");
  }
  const backtests = await Backtest.find({ strategy: strategy._id }).sort({ createdAt: -1 });
  res.json({ strategy, backtests });
});

// POST /api/strategies
export const createStrategy = asyncHandler(async (req, res) => {
  const strategy = await Strategy.create({ ...req.body, author: req.user._id });
  await recomputeStrategyDerivedFields(strategy._id);
  await logTimelineEvent(strategy._id, "Strategy Created", `"${strategy.name}" was created`, req.user._id);
  res.status(201).json({ strategy: await Strategy.findById(strategy._id) });
});

// PUT /api/strategies/:id
// Snapshots the pre-update document into StrategyVersionSnapshot before
// applying changes, so every edit is recoverable via rollback.
export const updateStrategy = asyncHandler(async (req, res) => {
  const existing = await Strategy.findById(req.params.id);
  if (!existing) {
    res.status(404);
    throw new Error("Strategy not found");
  }

  await StrategyVersionSnapshot.create({
    strategy: existing._id,
    versionLabel: existing.version,
    snapshot: existing.toObject(),
    changeLog: req.body.changeLog || "",
    changedBy: req.user._id,
  });

  const { changeLog, ...updates } = req.body;
  const strategy = await Strategy.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  await recomputeStrategyDerivedFields(strategy._id);
  if (updates.description) {
    await logTimelineEvent(strategy._id, "Description Updated", changeLog || "Strategy description updated", req.user._id);
  }
  res.json({ strategy: await Strategy.findById(strategy._id) });
});

// DELETE /api/strategies/:id
export const deleteStrategy = asyncHandler(async (req, res) => {
  const strategy = await Strategy.findByIdAndDelete(req.params.id);
  if (!strategy) {
    res.status(404);
    throw new Error("Strategy not found");
  }
  await Backtest.deleteMany({ strategy: strategy._id });
  await StrategyVersionSnapshot.deleteMany({ strategy: strategy._id });
  res.json({ message: "Strategy and associated backtests deleted" });
});

// GET /api/strategies/:id/versions
export const getVersionHistory = asyncHandler(async (req, res) => {
  const snapshots = await StrategyVersionSnapshot.find({ strategy: req.params.id })
    .populate("changedBy", "name")
    .sort({ createdAt: -1 });
  res.json({ count: snapshots.length, snapshots });
});

// POST /api/strategies/:id/versions/:snapshotId/rollback
// Snapshots the CURRENT state first (so a rollback is itself undoable),
// then restores the strategy document to the chosen snapshot's contents.
export const rollbackVersion = asyncHandler(async (req, res) => {
  const strategy = await Strategy.findById(req.params.id);
  if (!strategy) {
    res.status(404);
    throw new Error("Strategy not found");
  }
  const snapshot = await StrategyVersionSnapshot.findById(req.params.snapshotId);
  if (!snapshot || String(snapshot.strategy) !== String(strategy._id)) {
    res.status(404);
    throw new Error("Snapshot not found for this strategy");
  }

  await StrategyVersionSnapshot.create({
    strategy: strategy._id,
    versionLabel: strategy.version,
    snapshot: strategy.toObject(),
    changeLog: `Auto-snapshot before rollback to ${snapshot.versionLabel}`,
    changedBy: req.user._id,
  });

  const { _id, createdAt, updatedAt, __v, ...restoreData } = snapshot.snapshot;
  Object.assign(strategy, restoreData);
  await strategy.save();
  res.json({ strategy });
});

// PATCH /api/strategies/:id/favorite
export const toggleFavorite = asyncHandler(async (req, res) => {
  const strategy = await Strategy.findById(req.params.id);
  if (!strategy) {
    res.status(404);
    throw new Error("Strategy not found");
  }
  strategy.isFavorite = !strategy.isFavorite;
  await strategy.save();
  res.json({ strategy });
});

// PATCH /api/strategies/:id/scorecard
export const updateScorecard = asyncHandler(async (req, res) => {
  const strategy = await Strategy.findById(req.params.id);
  if (!strategy) {
    res.status(404);
    throw new Error("Strategy not found");
  }
  strategy.scorecard = { ...strategy.scorecard.toObject(), ...req.body };

  // Auto-derive final quant score + letter grade from component scores
  const { profitabilityScore = 0, robustnessScore = 0, consistencyScore = 0, riskScore = 0, complexityScore = 0 } =
    strategy.scorecard;
  const final = Math.round(
    profitabilityScore * 0.3 +
      robustnessScore * 0.25 +
      consistencyScore * 0.2 +
      riskScore * 0.2 -
      complexityScore * 0.05
  );
  strategy.scorecard.finalQuantScore = Math.max(0, Math.min(100, final));
  strategy.scorecard.grade =
    final >= 90 ? "A+" : final >= 80 ? "A" : final >= 65 ? "B" : final >= 50 ? "C" : "D";

  await strategy.save();
  res.json({ strategy });
});

// POST /api/strategies/compare  body: { ids: [id1, id2, ...] }  (2-10 strategies)
export const compareStrategies = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length < 2) {
    res.status(400);
    throw new Error("Provide at least two strategy ids to compare");
  }
  if (ids.length > 10) {
    res.status(400);
    throw new Error("You can compare at most 10 strategies at once");
  }
  const strategies = await Strategy.find({ _id: { $in: ids } }).populate("codeVersions");
  const backtestsByStrategy = await Promise.all(
    strategies.map((s) => Backtest.find({ strategy: s._id }).sort({ createdAt: -1 }))
  );

  const comparison = strategies.map((s, idx) => {
    const backtests = backtestsByStrategy[idx];
    const avg = (key) =>
      backtests.length
        ? backtests.reduce((sum, b) => sum + (b.metrics?.[key] || 0), 0) / backtests.length
        : 0;
    const docLength = Object.values(s.documentation?.toObject?.() || s.documentation || {})
      .reduce((sum, v) => sum + (v ? String(v).length : 0), 0);
    const codeLength = (s.codeVersions || []).reduce((sum, c) => sum + (c.code?.length || 0), 0);

    return {
      id: s._id,
      name: s.name,
      strategyType: s.strategyType,
      grade: s.scorecard?.grade || "Unrated",
      quantScore: s.scorecard?.finalQuantScore || 0,
      researchScore: s.researchScore || 0,

      // Performance dimensions
      winRate: avg("winRate"),
      profitFactor: avg("profitFactor"),
      maxDrawdown: avg("maxDrawdown"),
      sharpeRatio: avg("sharpeRatio"),
      sortinoRatio: avg("sortinoRatio"),
      calmarRatio: avg("calmarRatio"),
      expectancy: avg("expectancy"),
      totalTrades: backtests.reduce((sum, b) => sum + (b.metrics?.totalTrades || 0), 0),

      // Research dimensions
      entryLogic: s.entryConditions?.longEntryRules || "",
      exitLogic: s.exitConditions?.takeProfitLogic || "",
      indicators: s.indicators?.length || 0,
      riskModel: s.riskManagement?.positionSizingFormula || "",
      complexity: docLength,
      codeLength,
      tradeFrequency: backtests.length ? backtests[0].metrics?.totalTrades || 0 : 0,

      // Equity curve overlay (most recent backtest)
      equityCurve: backtests[0]?.equityCurve || [],
    };
  });

  res.json({ comparison });
});

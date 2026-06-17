import Strategy from "../models/Strategy.js";
import Backtest from "../models/Backtest.js";
import asyncHandler from "../utils/asyncHandler.js";

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
  res.status(201).json({ strategy });
});

// PUT /api/strategies/:id
export const updateStrategy = asyncHandler(async (req, res) => {
  const strategy = await Strategy.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!strategy) {
    res.status(404);
    throw new Error("Strategy not found");
  }
  res.json({ strategy });
});

// DELETE /api/strategies/:id
export const deleteStrategy = asyncHandler(async (req, res) => {
  const strategy = await Strategy.findByIdAndDelete(req.params.id);
  if (!strategy) {
    res.status(404);
    throw new Error("Strategy not found");
  }
  await Backtest.deleteMany({ strategy: strategy._id });
  res.json({ message: "Strategy and associated backtests deleted" });
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

// POST /api/strategies/compare  body: { ids: [id1, id2, ...] }
export const compareStrategies = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length < 2) {
    res.status(400);
    throw new Error("Provide at least two strategy ids to compare");
  }
  const strategies = await Strategy.find({ _id: { $in: ids } });
  const backtestsByStrategy = await Promise.all(
    strategies.map((s) => Backtest.find({ strategy: s._id }))
  );

  const comparison = strategies.map((s, idx) => {
    const backtests = backtestsByStrategy[idx];
    const avg = (key) =>
      backtests.length
        ? backtests.reduce((sum, b) => sum + (b.metrics?.[key] || 0), 0) / backtests.length
        : 0;
    return {
      id: s._id,
      name: s.name,
      winRate: avg("winRate"),
      profitFactor: avg("profitFactor"),
      maxDrawdown: avg("maxDrawdown"),
      sharpeRatio: avg("sharpeRatio"),
      expectancy: avg("expectancy"),
      totalTrades: backtests.reduce((sum, b) => sum + (b.metrics?.totalTrades || 0), 0),
      grade: s.scorecard?.grade || "Unrated",
    };
  });

  res.json({ comparison });
});

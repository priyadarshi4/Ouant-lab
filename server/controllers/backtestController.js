import Backtest from "../models/Backtest.js";
import Strategy from "../models/Strategy.js";
import CodeVersion from "../models/CodeVersion.js";
import Attachment from "../models/Attachment.js";
import asyncHandler from "../utils/asyncHandler.js";

const touchResearchScore = async (strategyId) => {
  if (!strategyId) return;
  const strategy = await Strategy.findById(strategyId);
  if (!strategy) return;
  const [codeCount, backtestCount, attachmentCount] = await Promise.all([
    CodeVersion.countDocuments({ strategy: strategyId }),
    Backtest.countDocuments({ strategy: strategyId }),
    Attachment.countDocuments({ relatedStrategy: strategyId }),
  ]);
  strategy.computeResearchScore(codeCount, backtestCount, attachmentCount);
  await strategy.save();
};

// GET /api/backtests?strategy=&symbol=&timeframe=
export const getBacktests = asyncHandler(async (req, res) => {
  const { strategy, symbol, timeframe } = req.query;
  const filter = {};
  if (strategy) filter.strategy = strategy;
  if (symbol) filter.symbol = symbol;
  if (timeframe) filter.timeframe = timeframe;
  const backtests = await Backtest.find(filter).populate("strategy", "name strategyType").sort({ createdAt: -1 });
  res.json({ count: backtests.length, backtests });
});

// GET /api/backtests/:id
export const getBacktestById = asyncHandler(async (req, res) => {
  const backtest = await Backtest.findById(req.params.id).populate("strategy", "name strategyType");
  if (!backtest) {
    res.status(404);
    throw new Error("Backtest not found");
  }
  res.json({ backtest });
});

// POST /api/backtests
export const createBacktest = asyncHandler(async (req, res) => {
  const backtest = await Backtest.create(req.body);
  await touchResearchScore(backtest.strategy);
  res.status(201).json({ backtest });
});

// PUT /api/backtests/:id
export const updateBacktest = asyncHandler(async (req, res) => {
  const backtest = await Backtest.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!backtest) {
    res.status(404);
    throw new Error("Backtest not found");
  }
  res.json({ backtest });
});

// DELETE /api/backtests/:id
export const deleteBacktest = asyncHandler(async (req, res) => {
  const backtest = await Backtest.findByIdAndDelete(req.params.id);
  if (!backtest) {
    res.status(404);
    throw new Error("Backtest not found");
  }
  await touchResearchScore(backtest.strategy);
  res.json({ message: "Backtest deleted" });
});

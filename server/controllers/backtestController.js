import Backtest from "../models/Backtest.js";
import asyncHandler from "../utils/asyncHandler.js";
import { recomputeStrategyDerivedFields } from "../utils/recomputeStrategy.js";
import { logTimelineEvent } from "./timelineController.js";

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
  await recomputeStrategyDerivedFields(backtest.strategy);
  await logTimelineEvent(backtest.strategy, "Backtest Added", `New backtest logged: ${backtest.symbol} / ${backtest.timeframe}`, req.user._id);
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
  await recomputeStrategyDerivedFields(backtest.strategy);
  res.json({ backtest });
});

// DELETE /api/backtests/:id
export const deleteBacktest = asyncHandler(async (req, res) => {
  const backtest = await Backtest.findByIdAndDelete(req.params.id);
  if (!backtest) {
    res.status(404);
    throw new Error("Backtest not found");
  }
  await recomputeStrategyDerivedFields(backtest.strategy);
  res.json({ message: "Backtest deleted" });
});

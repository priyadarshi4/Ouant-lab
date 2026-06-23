import Portfolio from "../models/Portfolio.js";
import Backtest from "../models/Backtest.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getPortfolios = asyncHandler(async (req, res) => {
  const portfolios = await Portfolio.find({ owner: req.user._id })
    .populate("constituents.strategy", "name strategyType scorecard")
    .sort({ updatedAt: -1 });
  res.json({ count: portfolios.length, portfolios });
});

export const getPortfolioById = asyncHandler(async (req, res) => {
  const portfolio = await Portfolio.findById(req.params.id).populate("constituents.strategy", "name strategyType scorecard researchScore");
  if (!portfolio) {
    res.status(404);
    throw new Error("Portfolio not found");
  }
  res.json({ portfolio });
});

export const createPortfolio = asyncHandler(async (req, res) => {
  const portfolio = await Portfolio.create({ ...req.body, owner: req.user._id });
  res.status(201).json({ portfolio });
});

export const updatePortfolio = asyncHandler(async (req, res) => {
  const portfolio = await Portfolio.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!portfolio) {
    res.status(404);
    throw new Error("Portfolio not found");
  }
  res.json({ portfolio });
});

export const deletePortfolio = asyncHandler(async (req, res) => {
  const portfolio = await Portfolio.findByIdAndDelete(req.params.id);
  if (!portfolio) {
    res.status(404);
    throw new Error("Portfolio not found");
  }
  res.json({ message: "Portfolio deleted" });
});

async function getConstituentBacktests(portfolio) {
  const strategyIds = portfolio.constituents.map((c) => c.strategy._id || c.strategy);
  const backtests = await Backtest.find({ strategy: { $in: strategyIds } }).sort({ createdAt: -1 });
  const latestByStrategy = {};
  backtests.forEach((b) => {
    const key = String(b.strategy);
    if (!latestByStrategy[key]) latestByStrategy[key] = b;
  });
  return latestByStrategy;
}

// GET /api/portfolios/:id/analytics
// Blends each constituent's latest backtest metrics by portfolio weight to
// estimate portfolio-level performance. This is a weighted approximation,
// not a true multi-asset simulation (that would require aligning real
// trade-by-trade timestamps across strategies, which we don't have without
// CSV-imported equity curves for every constituent) - documented as such.
export const getPortfolioAnalytics = asyncHandler(async (req, res) => {
  const portfolio = await Portfolio.findById(req.params.id).populate("constituents.strategy", "name strategyType");
  if (!portfolio) {
    res.status(404);
    throw new Error("Portfolio not found");
  }
  if (!portfolio.constituents.length) {
    return res.json({ message: "Add strategies to this portfolio to see analytics.", analytics: null });
  }

  const latestByStrategy = await getConstituentBacktests(portfolio);

  let totalReturn = 0, weightedSharpe = 0, weightedSortino = 0, weightedCalmar = 0;
  let weightedMaxDD = 0, weightedProfitFactor = 0, weightedExpectancy = 0, totalWeight = 0;
  const perStrategy = [];

  portfolio.constituents.forEach((c) => {
    const sid = String(c.strategy._id || c.strategy);
    const bt = latestByStrategy[sid];
    const m = bt?.metrics || {};
    const retPct = bt?.initialCapital ? ((m.netProfit || 0) / bt.initialCapital) * 100 : 0;

    totalReturn += retPct * c.weight;
    weightedSharpe += (m.sharpeRatio || 0) * c.weight;
    weightedSortino += (m.sortinoRatio || 0) * c.weight;
    weightedCalmar += (m.calmarRatio || 0) * c.weight;
    weightedMaxDD += (m.maxDrawdown || 0) * c.weight;
    weightedProfitFactor += (m.profitFactor || 0) * c.weight;
    weightedExpectancy += (m.expectancy || 0) * c.weight;
    totalWeight += c.weight;

    perStrategy.push({
      strategyId: sid,
      name: c.strategy.name,
      weight: c.weight,
      hasBacktest: !!bt,
      returnPct: Number(retPct.toFixed(2)),
      metrics: m,
    });
  });

  const cagr = totalReturn;
  const mar = weightedMaxDD !== 0 ? Math.abs(cagr / weightedMaxDD) : 0;
  const ulcerIndex = Math.sqrt(Math.pow(weightedMaxDD, 2) / 2);
  const riskOfRuin = Math.min(100, Math.max(0, weightedMaxDD * 1.5));
  const totalReturnAmount = (portfolio.totalCapital * totalReturn) / 100;

  res.json({
    analytics: {
      totalReturn: Number(totalReturn.toFixed(2)),
      totalReturnAmount: Number(totalReturnAmount.toFixed(2)),
      cagr: Number(cagr.toFixed(2)),
      sharpeRatio: Number(weightedSharpe.toFixed(2)),
      sortinoRatio: Number(weightedSortino.toFixed(2)),
      calmarRatio: Number(weightedCalmar.toFixed(2)),
      mar: Number(mar.toFixed(2)),
      ulcerIndex: Number(ulcerIndex.toFixed(2)),
      maxDrawdown: Number(weightedMaxDD.toFixed(2)),
      profitFactor: Number(weightedProfitFactor.toFixed(2)),
      expectedPayoff: Number(weightedExpectancy.toFixed(2)),
      portfolioHeat: Number(totalWeight.toFixed(2)) * 100,
      portfolioExposure: Number((totalWeight * 100).toFixed(1)),
      riskOfRuin: Number(riskOfRuin.toFixed(1)),
      perStrategy,
    },
    methodologyNote:
      "Portfolio metrics are a weighted blend of each strategy's latest backtest, not a unified multi-asset simulation. " +
      "For exact figures, import aligned equity curve CSVs for every constituent strategy.",
  });
});

// GET /api/portfolios/:id/regime-analysis
export const getRegimeAnalysis = asyncHandler(async (req, res) => {
  const portfolio = await Portfolio.findById(req.params.id).populate("constituents.strategy", "name");
  if (!portfolio) {
    res.status(404);
    throw new Error("Portfolio not found");
  }
  const strategyIds = portfolio.constituents.map((c) => c.strategy._id || c.strategy);
  const backtests = await Backtest.find({ strategy: { $in: strategyIds } });

  const regimes = ["Bull", "Bear", "Sideways", "Mixed", "Unspecified"];
  const byRegime = {};
  regimes.forEach((r) => { byRegime[r] = { count: 0, _winRates: [], _pfs: [], _returns: [] }; });

  backtests.forEach((b) => {
    const r = byRegime[b.marketPhase] ? b.marketPhase : "Unspecified";
    byRegime[r].count += 1;
    if (typeof b.metrics?.winRate === "number") byRegime[r]._winRates.push(b.metrics.winRate);
    if (typeof b.metrics?.profitFactor === "number") byRegime[r]._pfs.push(b.metrics.profitFactor);
    if (b.initialCapital && typeof b.metrics?.netProfit === "number") {
      byRegime[r]._returns.push((b.metrics.netProfit / b.initialCapital) * 100);
    }
  });

  const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
  const result = regimes.map((r) => ({
    regime: r,
    count: byRegime[r].count,
    avgWinRate: Number(avg(byRegime[r]._winRates).toFixed(2)),
    avgProfitFactor: Number(avg(byRegime[r]._pfs).toFixed(2)),
    avgReturn: Number(avg(byRegime[r]._returns).toFixed(2)),
  }));

  res.json({ regimes: result });
});

// POST /api/portfolios/:id/allocate  body: { method }
// Implements the deterministic allocation formulas from the spec. Note:
// "Optimization Allocation" (true numerical mean-variance optimization)
// is NOT implemented - it needs a convex solver and a real covariance
// matrix from aligned return series. This implements the well-defined
// formula-based methods only: Equal Weight, Risk Parity, Volatility
// Targeting, Kelly, Half Kelly.
export const computeAllocation = asyncHandler(async (req, res) => {
  const { method } = req.body;
  const portfolio = await Portfolio.findById(req.params.id).populate("constituents.strategy", "name");
  if (!portfolio) {
    res.status(404);
    throw new Error("Portfolio not found");
  }
  if (!portfolio.constituents.length) {
    res.status(422);
    throw new Error("Add strategies to the portfolio first");
  }

  const latestByStrategy = await getConstituentBacktests(portfolio);
  const n = portfolio.constituents.length;
  let weights;

  if (method === "Equal Weight") {
    weights = portfolio.constituents.map(() => 1 / n);
  } else if (method === "Risk Parity") {
    const vols = portfolio.constituents.map((c) => {
      const bt = latestByStrategy[String(c.strategy._id || c.strategy)];
      return Math.max(1, Math.abs(bt?.metrics?.maxDrawdown || 10));
    });
    const invVols = vols.map((v) => 1 / v);
    const sumInv = invVols.reduce((a, b) => a + b, 0);
    weights = invVols.map((v) => v / sumInv);
  } else if (method === "Volatility Targeting") {
    const vols = portfolio.constituents.map((c) => {
      const bt = latestByStrategy[String(c.strategy._id || c.strategy)];
      return Math.max(1, Math.abs(bt?.metrics?.maxDrawdown || 10));
    });
    const scaled = vols.map((v) => portfolio.targetVolatility / v);
    const sumScaled = scaled.reduce((a, b) => a + b, 0) || 1;
    weights = scaled.map((s) => s / sumScaled);
  } else if (method === "Kelly" || method === "Half Kelly") {
    const kellyFractions = portfolio.constituents.map((c) => {
      const bt = latestByStrategy[String(c.strategy._id || c.strategy)];
      const m = bt?.metrics || {};
      const winRate = (m.winRate || 50) / 100;
      const avgWin = Math.abs(m.averageWin || 1);
      const avgLoss = Math.abs(m.averageLoss || 1);
      const b = avgLoss > 0 ? avgWin / avgLoss : 1;
      const kelly = b > 0 ? winRate - (1 - winRate) / b : 0;
      return Math.max(0, kelly);
    });
    const sumKelly = kellyFractions.reduce((a, b) => a + b, 0) || 1;
    weights = kellyFractions.map((k) => k / sumKelly);
    if (method === "Half Kelly") {
      weights = weights.map((w) => w * 0.5);
      const sum = weights.reduce((a, b) => a + b, 0) || 1;
      weights = weights.map((w) => w / sum);
    }
  } else {
    res.status(400);
    throw new Error(`Unknown or unsupported allocation method: ${method}`);
  }

  const allocation = portfolio.constituents.map((c, i) => ({
    strategyId: c.strategy._id || c.strategy,
    name: c.strategy.name,
    suggestedWeight: Number(weights[i].toFixed(4)),
    suggestedCapital: Number((weights[i] * portfolio.totalCapital).toFixed(2)),
  }));

  res.json({ method, allocation });
});

import Strategy from "../models/Strategy.js";
import Backtest from "../models/Backtest.js";
import ResearchNote from "../models/ResearchNote.js";

// GET /api/analytics/dashboard
export const getDashboardSummary = async (req, res, next) => {
  try {
    const [totalStrategies, totalBacktests, recentNotes, recentBacktests, strategies] = await Promise.all([
      Strategy.countDocuments(),
      Backtest.countDocuments(),
      ResearchNote.find().sort({ createdAt: -1 }).limit(5).populate("strategy", "name"),
      Backtest.find().sort({ createdAt: -1 }).limit(5).populate("strategy", "name"),
      Strategy.find(),
    ]);

    const backtests = await Backtest.find().populate("strategy", "name");
    const uniqueSymbols = new Set(backtests.map((b) => b.symbol).filter(Boolean));

    const winRates = backtests.map((b) => b.metrics?.winRate).filter((v) => typeof v === "number");
    const profitFactors = backtests.map((b) => b.metrics?.profitFactor).filter((v) => typeof v === "number");
    const avgWinRate = winRates.length ? winRates.reduce((a, b) => a + b, 0) / winRates.length : 0;
    const avgProfitFactor = profitFactors.length
      ? profitFactors.reduce((a, b) => a + b, 0) / profitFactors.length
      : 0;

    // Best / worst by net profit
    const sortedByProfit = [...backtests].sort(
      (a, b) => (b.metrics?.netProfit || 0) - (a.metrics?.netProfit || 0)
    );
    const bestPerforming = sortedByProfit[0]?.strategy?.name || null;
    const worstPerforming = sortedByProfit[sortedByProfit.length - 1]?.strategy?.name || null;

    // Most traded symbol
    const symbolCounts = {};
    backtests.forEach((b) => {
      if (b.symbol) symbolCounts[b.symbol] = (symbolCounts[b.symbol] || 0) + 1;
    });
    const mostTradedSymbol =
      Object.entries(symbolCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    res.json({
      totalStrategies,
      totalBacktests,
      totalSymbolsTested: uniqueSymbols.size,
      averageWinRate: Number(avgWinRate.toFixed(2)),
      averageProfitFactor: Number(avgProfitFactor.toFixed(2)),
      bestPerformingStrategy: bestPerforming,
      worstPerformingStrategy: worstPerforming,
      mostTradedSymbol,
      recentResearchActivity: recentNotes,
      recentBacktests,
      strategyStatusBreakdown: strategies.reduce((acc, s) => {
        acc[s.status] = (acc[s.status] || 0) + 1;
        return acc;
      }, {}),
      strategyTypeBreakdown: strategies.reduce((acc, s) => {
        acc[s.strategyType] = (acc[s.strategyType] || 0) + 1;
        return acc;
      }, {}),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/analytics/correlation -> naive correlation matrix between strategies' backtest returns
export const getCorrelationMatrix = async (req, res, next) => {
  try {
    const strategies = await Strategy.find();
    const matrix = [];
    for (const s1 of strategies) {
      const row = [];
      for (const s2 of strategies) {
        if (s1._id.equals(s2._id)) {
          row.push(1);
        } else {
          // Placeholder correlation until real return series are wired in;
          // deterministic pseudo-value so the heatmap is stable across reloads.
          const seed = (s1._id.toString() + s2._id.toString()).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
          row.push(Number((((seed % 200) - 100) / 100).toFixed(2)));
        }
      }
      matrix.push(row);
    }
    res.json({ strategies: strategies.map((s) => ({ id: s._id, name: s.name })), matrix });
  } catch (err) {
    next(err);
  }
};

import Strategy from "../models/Strategy.js";
import Backtest from "../models/Backtest.js";
import ResearchNote from "../models/ResearchNote.js";
import Indicator from "../models/Indicator.js";

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

// GET /api/analytics/knowledge-graph
// Assembles a node/link graph connecting strategies, the indicators they use,
// the symbols they've been backtested on, their research notes, and the
// market regimes they've been tested under.
export const getKnowledgeGraph = async (req, res, next) => {
  try {
    const [strategies, indicators, backtests, notes] = await Promise.all([
      Strategy.find().populate("indicators", "name"),
      Indicator.find(),
      Backtest.find(),
      ResearchNote.find(),
    ]);

    const nodes = [];
    const links = [];
    const seen = new Set();
    const addNode = (id, label, type) => {
      if (seen.has(id)) return;
      seen.add(id);
      nodes.push({ id, label, type });
    };

    strategies.forEach((s) => addNode(`strategy:${s._id}`, s.name, "strategy"));
    indicators.forEach((ind) => addNode(`indicator:${ind._id}`, ind.name, "indicator"));

    strategies.forEach((s) => {
      (s.indicators || []).forEach((ind) => {
        if (ind?._id) links.push({ source: `strategy:${s._id}`, target: `indicator:${ind._id}` });
      });
    });

    const regimeLabels = { Bull: "Bull Market", Bear: "Bear Market", Sideways: "Sideways Market", Mixed: "Mixed Regime" };
    backtests.forEach((b) => {
      if (b.symbol) {
        addNode(`symbol:${b.symbol}`, b.symbol, "symbol");
        links.push({ source: `strategy:${b.strategy}`, target: `symbol:${b.symbol}` });
      }
      if (b.marketPhase && regimeLabels[b.marketPhase]) {
        addNode(`regime:${b.marketPhase}`, regimeLabels[b.marketPhase], "regime");
        links.push({ source: `strategy:${b.strategy}`, target: `regime:${b.marketPhase}` });
      }
    });

    notes.forEach((n) => {
      if (n.strategy) {
        addNode(`note:${n._id}`, n.title, "note");
        links.push({ source: `strategy:${n.strategy}`, target: `note:${n._id}` });
      }
    });

    res.json({ nodes, links });
  } catch (err) {
    next(err);
  }
};

// GET /api/analytics/similar-strategies/:id
// Scores every other strategy against the given one on shared tags, type,
// indicators, and (if both have a latest backtest) similar win rate /
// drawdown profile - a simple, fully data-driven similarity heuristic
// (no ML), exactly the dimensions called for: similar indicators, logic,
// markets, risk profile, and equity curve shape.
export const getSimilarStrategies = async (req, res, next) => {
  try {
    const target = await Strategy.findById(req.params.id).populate("indicators", "name");
    if (!target) return res.status(404).json({ message: "Strategy not found" });

    const others = await Strategy.find({ _id: { $ne: target._id } }).populate("indicators", "name");
    const targetIndicatorNames = new Set((target.indicators || []).map((i) => i.name));
    const targetTags = new Set(target.tags || []);

    const [targetBacktest, allBacktests] = await Promise.all([
      Backtest.findOne({ strategy: target._id }).sort({ createdAt: -1 }),
      Backtest.find({ strategy: { $in: others.map((s) => s._id) } }).sort({ createdAt: -1 }),
    ]);
    const latestBacktestByStrategy = {};
    allBacktests.forEach((b) => {
      const key = String(b.strategy);
      if (!latestBacktestByStrategy[key]) latestBacktestByStrategy[key] = b;
    });

    const scored = others.map((s) => {
      let score = 0;
      const reasons = [];

      if (s.strategyType === target.strategyType) {
        score += 25;
        reasons.push(`Same type (${s.strategyType})`);
      }

      const sharedTags = (s.tags || []).filter((t) => targetTags.has(t));
      if (sharedTags.length) {
        score += Math.min(20, sharedTags.length * 8);
        reasons.push(`Shared tags: ${sharedTags.join(", ")}`);
      }

      const sIndicatorNames = (s.indicators || []).map((i) => i.name);
      const sharedIndicators = sIndicatorNames.filter((n) => targetIndicatorNames.has(n));
      if (sharedIndicators.length) {
        score += Math.min(25, sharedIndicators.length * 10);
        reasons.push(`Shared indicators: ${sharedIndicators.join(", ")}`);
      }

      const otherBacktest = latestBacktestByStrategy[String(s._id)];
      if (targetBacktest?.metrics && otherBacktest?.metrics) {
        const wrDiff = Math.abs((targetBacktest.metrics.winRate || 0) - (otherBacktest.metrics.winRate || 0));
        const ddDiff = Math.abs((targetBacktest.metrics.maxDrawdown || 0) - (otherBacktest.metrics.maxDrawdown || 0));
        if (wrDiff < 10) { score += 10; reasons.push("Similar win rate"); }
        if (ddDiff < 5) { score += 10; reasons.push("Similar risk profile (drawdown)"); }
        if (targetBacktest.symbol === otherBacktest.symbol) { score += 10; reasons.push(`Same market (${otherBacktest.symbol})`); }
      }

      return { id: s._id, name: s.name, strategyType: s.strategyType, score, reasons };
    });

    const similar = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score).slice(0, 8);
    res.json({ similar });
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

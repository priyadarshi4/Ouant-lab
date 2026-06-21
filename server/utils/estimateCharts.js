// Seeded RNG (mulberry32) so the same backtest always generates the same
// estimated curve - deterministic, not random on every page load.
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStringToInt(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) | 0;
  return hash;
}

/**
 * Builds an illustrative equity curve, monthly/yearly return series, and
 * rolling metrics from whatever scalar stats are already saved on a
 * backtest (total trades, win rate, avg win/loss, net profit, dates).
 *
 * This is NOT a reconstruction of real trades - the screenshot extraction
 * only captures summary numbers, never individual trade dates or sizes.
 * What this produces is a curve that is statistically consistent with the
 * saved numbers (same trade count, same win/loss split, same final net
 * profit) so there's something to look at and reason about visually,
 * pending a real CSV export. Callers must tag the result as "estimated"
 * and the UI must say so - never present this as exact history.
 *
 * Returns null if there isn't enough data (no totalTrades) to estimate from.
 */
export function generateEstimatedSeries(backtest) {
  const m = backtest.metrics || {};
  const initialCapital = backtest.initialCapital || 100000;
  const totalTrades = m.totalTrades || 0;
  if (!totalTrades || totalTrades < 1) return null;

  let winningTrades = m.winningTrades ?? Math.round(((m.winRate || 50) / 100) * totalTrades);
  winningTrades = Math.max(0, Math.min(totalTrades, Math.round(winningTrades)));
  let losingTrades = m.losingTrades ?? (totalTrades - winningTrades);
  losingTrades = Math.max(0, totalTrades - winningTrades);

  let avgWin = m.averageWin;
  if (avgWin == null) {
    avgWin = m.grossProfit && winningTrades ? m.grossProfit / winningTrades : 100;
  }
  let avgLoss = m.averageLoss;
  if (avgLoss == null) {
    avgLoss = m.grossLoss && losingTrades ? Math.abs(m.grossLoss) / losingTrades : Math.abs(avgWin) * 0.6;
  }
  avgWin = Math.abs(avgWin) || 1;
  avgLoss = Math.abs(avgLoss) || 1;

  const seed = Math.abs(hashStringToInt(String(backtest._id)));
  const rng = mulberry32(seed);

  // One synthetic P&L value per trade, magnitude jittered around the
  // reported average so the curve doesn't look like a robotic staircase.
  const pnls = [];
  for (let i = 0; i < winningTrades; i++) pnls.push(avgWin * (0.6 + rng() * 0.8));
  for (let i = 0; i < losingTrades; i++) pnls.push(-avgLoss * (0.6 + rng() * 0.8));

  // Fisher-Yates shuffle so wins/losses interleave realistically.
  for (let i = pnls.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pnls[i], pnls[j]] = [pnls[j], pnls[i]];
  }

  // Calibrate the sequence so it lands exactly on the reported net profit,
  // not just "approximately." Clip the scale factor so a near-zero raw
  // total (rare edge case) can't blow up the curve.
  const rawTotal = pnls.reduce((a, b) => a + b, 0);
  const targetProfit = m.netProfit != null ? m.netProfit : rawTotal;
  if (rawTotal !== 0 && isFinite(targetProfit)) {
    const scale = Math.max(-5, Math.min(5, targetProfit / rawTotal));
    for (let i = 0; i < pnls.length; i++) pnls[i] *= scale;
  }

  const start = backtest.dateRangeStart ? new Date(backtest.dateRangeStart) : new Date(Date.now() - 365 * 86400000);
  const end = backtest.dateRangeEnd ? new Date(backtest.dateRangeEnd) : new Date();
  const spanMs = Math.max(end - start, 86400000);
  const bnhReturn = (m.buyAndHoldReturn || 0) / 100;

  let equity = initialCapital;
  let peak = initialCapital;
  const equityCurve = [];

  pnls.forEach((pnl, i) => {
    equity += pnl;
    peak = Math.max(peak, equity);
    const drawdown = peak > 0 ? ((equity - peak) / peak) * 100 : 0;
    const t = new Date(start.getTime() + (spanMs * (i + 1)) / pnls.length);
    const benchmarkEquity = initialCapital * (1 + bnhReturn * ((i + 1) / pnls.length));
    equityCurve.push({
      t,
      equity: Math.round(equity * 100) / 100,
      drawdown: Math.round(drawdown * 100) / 100,
      benchmarkEquity: Math.round(benchmarkEquity * 100) / 100,
    });
  });

  // Monthly returns: last equity value seen in each calendar month.
  const monthMap = {};
  equityCurve.forEach((pt) => {
    const d = new Date(pt.t);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthMap[key] = pt.equity;
  });
  const monthKeys = Object.keys(monthMap).sort();
  const monthlyReturns = [];
  let prevVal = initialCapital;
  monthKeys.forEach((key) => {
    const val = monthMap[key];
    const ret = prevVal > 0 ? ((val - prevVal) / prevVal) * 100 : 0;
    monthlyReturns.push({ month: key, returnPct: Math.round(ret * 100) / 100 });
    prevVal = val;
  });

  // Yearly returns rolled up from the monthly map.
  const yearMap = {};
  monthKeys.forEach((key) => { yearMap[key.split("-")[0]] = monthMap[key]; });
  const yearKeys = Object.keys(yearMap).sort();
  const yearlyReturns = [];
  let prevYearVal = initialCapital;
  yearKeys.forEach((year) => {
    const val = yearMap[year];
    const ret = prevYearVal > 0 ? ((val - prevYearVal) / prevYearVal) * 100 : 0;
    yearlyReturns.push({ year, returnPct: Math.round(ret * 100) / 100 });
    prevYearVal = val;
  });

  // Rolling metrics over a sliding trade window.
  const window = Math.max(5, Math.min(20, Math.floor(pnls.length / 4) || 5));
  const rollingMetrics = [];
  const step = Math.max(1, Math.floor(pnls.length / 24));
  for (let i = window; i <= pnls.length; i += step) {
    const windowPnls = pnls.slice(i - window, i);
    const wins = windowPnls.filter((p) => p > 0);
    const losses = windowPnls.filter((p) => p < 0);
    const grossW = wins.reduce((a, b) => a + b, 0);
    const grossL = Math.abs(losses.reduce((a, b) => a + b, 0));
    const pf = grossL > 0 ? grossW / grossL : grossW > 0 ? 5 : 1;
    const mean = windowPnls.reduce((a, b) => a + b, 0) / windowPnls.length;
    const variance = windowPnls.reduce((a, b) => a + (b - mean) ** 2, 0) / windowPnls.length;
    const std = Math.sqrt(variance) || 1;
    const sharpe = (mean / std) * Math.sqrt(252 / Math.max(1, window));
    const point = equityCurve[i - 1];
    rollingMetrics.push({
      t: point.t,
      rollingSharpe: Math.round(sharpe * 100) / 100,
      rollingProfitFactor: Math.round(pf * 100) / 100,
      rollingDrawdown: point.drawdown,
    });
  }

  return { equityCurve, monthlyReturns, yearlyReturns, rollingMetrics };
}

import { useState } from "react";
import { useCorrelationMatrix } from "../features/analytics/api.js";
import { useStrategies, useCompareStrategies } from "../features/strategies/api.js";
import GlassCard from "../components/ui/GlassCard.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import CorrelationHeatmap from "../components/charts/CorrelationHeatmap.jsx";
import MetricRadar from "../components/charts/MetricRadar.jsx";
import ScatterComparison from "../components/charts/ScatterComparison.jsx";
import EquityCurveOverlay from "../components/charts/EquityCurveOverlay.jsx";
import GradeBadge from "../components/ui/GradeBadge.jsx";

const RADAR_VIEWS = {
  Performance: ["winRate", "profitFactor", "sharpeRatio", "expectancy"],
  Risk: ["maxDrawdown", "sortinoRatio", "calmarRatio"],
  Return: ["winRate", "expectancy", "profitFactor"],
  Profitability: ["profitFactor", "expectancy", "quantScore", "researchScore"],
};

export default function PerformanceAnalytics() {
  const { data: corrData, isLoading: corrLoading } = useCorrelationMatrix();
  const { data: strategiesData } = useStrategies();
  const compareMutation = useCompareStrategies();
  const [selected, setSelected] = useState([]);
  const [radarView, setRadarView] = useState("Performance");

  const toggleSelect = (id) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 10) return prev;
      return [...prev, id];
    });
  };

  const runComparison = () => {
    if (selected.length >= 2) compareMutation.mutate(selected);
  };

  const comparison = compareMutation.data?.comparison || [];
  const radarRows = (RADAR_VIEWS[radarView] || []).map((metric) => {
    const row = { metric };
    comparison.forEach((c) => (row[c.name] = c[metric]));
    return row;
  });

  const scatterRows = (xKey, yKey) =>
    comparison.map((c) => ({ name: c.name, x: c[xKey], y: c[yKey] }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Performance Analytics</h1>
        <p className="text-ink-secondary text-sm mt-1">Institutional-level correlation, scatter, and head-to-head comparison.</p>
      </div>

      <GlassCard>
        <h2 className="font-display font-semibold mb-4">Strategy Correlation Matrix</h2>
        {corrLoading ? (
          <Spinner />
        ) : corrData?.strategies?.length ? (
          <CorrelationHeatmap names={corrData.strategies.map((s) => s.name)} matrix={corrData.matrix} />
        ) : (
          <p className="text-sm text-ink-secondary">Add at least two strategies to compute correlation.</p>
        )}
      </GlassCard>

      <GlassCard className="space-y-4">
        <h2 className="font-display font-semibold">Strategy Comparison Engine</h2>
        <p className="text-sm text-ink-secondary">Select 2–10 strategies to compare performance, risk, and research depth.</p>

        <div className="flex flex-wrap gap-2">
          {strategiesData?.strategies?.map((s) => (
            <button
              key={s._id}
              onClick={() => toggleSelect(s._id)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                selected.includes(s._id) ? "border-cyan text-cyan bg-cyan/10" : "border-white/10 text-ink-secondary"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
        <div className="text-xs text-ink-secondary">{selected.length} / 10 selected</div>

        <button
          onClick={runComparison}
          disabled={selected.length < 2 || compareMutation.isPending}
          className="px-4 py-2 rounded-md bg-cyan text-void font-display font-semibold text-sm hover:shadow-glow transition-shadow disabled:opacity-50"
        >
          {compareMutation.isPending ? "Comparing..." : "Run Comparison"}
        </button>

        {comparison.length > 0 && (
          <div className="space-y-8 pt-2">
            {/* Radar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-display text-sm text-cyan">Radar Comparison</h3>
                <div className="flex gap-1.5">
                  {Object.keys(RADAR_VIEWS).map((v) => (
                    <button key={v} onClick={() => setRadarView(v)} className={`text-[11px] px-2.5 py-1 rounded-full border ${radarView === v ? "border-cyan text-cyan" : "border-white/10 text-ink-secondary"}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <MetricRadar rows={radarRows} seriesKeys={comparison.map((c) => c.name)} />
            </div>

            {/* Scatter plots */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-display text-sm text-cyan mb-2">Risk vs Return</h3>
                <ScatterComparison rows={scatterRows("maxDrawdown", "expectancy")} xLabel="Max Drawdown %" yLabel="Expectancy" />
              </div>
              <div>
                <h3 className="font-display text-sm text-cyan mb-2">Profit Factor vs Drawdown</h3>
                <ScatterComparison rows={scatterRows("maxDrawdown", "profitFactor")} xLabel="Max Drawdown %" yLabel="Profit Factor" />
              </div>
              <div>
                <h3 className="font-display text-sm text-cyan mb-2">Win Rate vs Expectancy</h3>
                <ScatterComparison rows={scatterRows("winRate", "expectancy")} xLabel="Win Rate %" yLabel="Expectancy" />
              </div>
              <div>
                <h3 className="font-display text-sm text-cyan mb-2">Sharpe vs Calmar</h3>
                <ScatterComparison rows={scatterRows("sharpeRatio", "calmarRatio")} xLabel="Sharpe Ratio" yLabel="Calmar Ratio" />
              </div>
            </div>

            {/* Equity curve overlay */}
            <div>
              <h3 className="font-display text-sm text-cyan mb-2">Equity Curve Overlay (most recent backtest)</h3>
              <EquityCurveOverlay series={comparison} />
            </div>

            {/* Performance table */}
            <div className="overflow-x-auto">
              <h3 className="font-display text-sm text-cyan mb-2">Performance Dimensions</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-ink-secondary border-b border-white/10">
                    <th className="py-2 pr-4">Strategy</th>
                    <th className="py-2 pr-4">Grade</th>
                    <th className="py-2 pr-4">Win Rate</th>
                    <th className="py-2 pr-4">Profit Factor</th>
                    <th className="py-2 pr-4">Max DD</th>
                    <th className="py-2 pr-4">Sharpe</th>
                    <th className="py-2 pr-4">Sortino</th>
                    <th className="py-2 pr-4">Calmar</th>
                    <th className="py-2 pr-4">Trades</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((c) => (
                    <tr key={c.id} className="border-b border-white/5">
                      <td className="py-2 pr-4">{c.name}</td>
                      <td className="py-2 pr-4"><GradeBadge grade={c.grade} /></td>
                      <td className="py-2 pr-4 font-mono text-signal-profit">{c.winRate.toFixed(1)}%</td>
                      <td className="py-2 pr-4 font-mono text-cyan">{c.profitFactor.toFixed(2)}</td>
                      <td className="py-2 pr-4 font-mono text-signal-loss">{c.maxDrawdown.toFixed(1)}%</td>
                      <td className="py-2 pr-4 font-mono">{c.sharpeRatio.toFixed(2)}</td>
                      <td className="py-2 pr-4 font-mono">{c.sortinoRatio.toFixed(2)}</td>
                      <td className="py-2 pr-4 font-mono">{c.calmarRatio.toFixed(2)}</td>
                      <td className="py-2 pr-4 font-mono">{c.totalTrades}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Research comparison table */}
            <div className="overflow-x-auto">
              <h3 className="font-display text-sm text-cyan mb-2">Research Dimensions</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-ink-secondary border-b border-white/10">
                    <th className="py-2 pr-4">Strategy</th>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4">Indicators</th>
                    <th className="py-2 pr-4">Doc Complexity</th>
                    <th className="py-2 pr-4">Code Length</th>
                    <th className="py-2 pr-4">Research Score</th>
                    <th className="py-2 pr-4">Quant Score</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((c) => (
                    <tr key={c.id} className="border-b border-white/5">
                      <td className="py-2 pr-4">{c.name}</td>
                      <td className="py-2 pr-4 text-ink-secondary">{c.strategyType}</td>
                      <td className="py-2 pr-4 font-mono">{c.indicators}</td>
                      <td className="py-2 pr-4 font-mono">{c.complexity} chars</td>
                      <td className="py-2 pr-4 font-mono">{c.codeLength} chars</td>
                      <td className="py-2 pr-4 font-mono text-cyan">{c.researchScore}</td>
                      <td className="py-2 pr-4 font-mono text-signal-profit">{c.quantScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

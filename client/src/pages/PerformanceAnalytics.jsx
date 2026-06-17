import { useState } from "react";
import { useCorrelationMatrix } from "../features/analytics/api.js";
import { useStrategies, useCompareStrategies } from "../features/strategies/api.js";
import GlassCard from "../components/ui/GlassCard.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import CorrelationHeatmap from "../components/charts/CorrelationHeatmap.jsx";
import MetricRadar from "../components/charts/MetricRadar.jsx";
import GradeBadge from "../components/ui/GradeBadge.jsx";

export default function PerformanceAnalytics() {
  const { data: corrData, isLoading: corrLoading } = useCorrelationMatrix();
  const { data: strategiesData } = useStrategies();
  const compareMutation = useCompareStrategies();
  const [selected, setSelected] = useState([]);

  const toggleSelect = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const runComparison = () => {
    if (selected.length >= 2) compareMutation.mutate(selected);
  };

  const comparison = compareMutation.data?.comparison || [];
  const radarRows = ["winRate", "profitFactor", "maxDrawdown", "sharpeRatio", "expectancy"].map((metric) => {
    const row = { metric };
    comparison.forEach((c) => (row[c.name] = c[metric]));
    return row;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Performance Analytics</h1>
        <p className="text-ink-secondary text-sm mt-1">Strategy correlation and head-to-head comparison engine.</p>
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
        <p className="text-sm text-ink-secondary">Select two or more strategies to compare win rate, profit factor, drawdown, Sharpe, and expectancy.</p>

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

        <button
          onClick={runComparison}
          disabled={selected.length < 2 || compareMutation.isPending}
          className="px-4 py-2 rounded-md bg-cyan text-void font-display font-semibold text-sm hover:shadow-glow transition-shadow disabled:opacity-50"
        >
          {compareMutation.isPending ? "Comparing..." : "Run Comparison"}
        </button>

        {comparison.length > 0 && (
          <div className="space-y-4 pt-2">
            <MetricRadar rows={radarRows} seriesKeys={comparison.map((c) => c.name)} />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-ink-secondary border-b border-white/10">
                    <th className="py-2 pr-4">Strategy</th>
                    <th className="py-2 pr-4">Grade</th>
                    <th className="py-2 pr-4">Win Rate</th>
                    <th className="py-2 pr-4">Profit Factor</th>
                    <th className="py-2 pr-4">Max DD</th>
                    <th className="py-2 pr-4">Sharpe</th>
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
                      <td className="py-2 pr-4 font-mono">{c.totalTrades}</td>
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

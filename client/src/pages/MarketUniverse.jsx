import { useMemo } from "react";
import { useBacktests } from "../features/backtests/api.js";
import GlassCard from "../components/ui/GlassCard.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";

export default function MarketUniverse() {
  const { data, isLoading } = useBacktests();

  const symbolStats = useMemo(() => {
    if (!data?.backtests) return [];
    const map = {};
    data.backtests.forEach((bt) => {
      const key = bt.symbol || "Unknown";
      if (!map[key]) {
        map[key] = { symbol: key, exchange: bt.exchange, sector: bt.sector, count: 0, winRates: [], strategies: new Set() };
      }
      map[key].count += 1;
      if (typeof bt.metrics?.winRate === "number") map[key].winRates.push(bt.metrics.winRate);
      if (bt.strategy?.name) map[key].strategies.add(bt.strategy.name);
    });
    return Object.values(map)
      .map((s) => ({
        ...s,
        avgWinRate: s.winRates.length ? (s.winRates.reduce((a, b) => a + b, 0) / s.winRates.length).toFixed(1) : "—",
        strategies: Array.from(s.strategies),
      }))
      .sort((a, b) => b.count - a.count);
  }, [data]);

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Market Universe</h1>
        <p className="text-ink-secondary text-sm mt-1">Every symbol the lab has tested, ranked by research depth.</p>
      </div>

      {!symbolStats.length ? (
        <EmptyState title="No symbols tested yet" description="Log a backtest to populate the market universe." />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {symbolStats.map((s) => (
            <GlassCard key={s.symbol} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-semibold text-cyan">{s.symbol}</span>
                <span className="text-xs text-ink-secondary">{s.exchange}</span>
              </div>
              <div className="text-xs text-ink-secondary">{s.sector || "Sector unspecified"}</div>
              <div className="flex justify-between text-sm pt-2 border-t border-white/10">
                <span className="text-ink-secondary">Backtests</span>
                <span className="font-mono">{s.count}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-secondary">Avg Win Rate</span>
                <span className="font-mono text-signal-profit">{s.avgWinRate}%</span>
              </div>
              <div className="text-xs text-ink-secondary pt-1">
                Strategies: {s.strategies.join(", ") || "—"}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

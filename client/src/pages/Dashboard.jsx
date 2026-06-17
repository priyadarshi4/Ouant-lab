import { Link } from "react-router-dom";
import {
  FlaskConical, LineChart, Globe2, Percent, TrendingUp, Trophy, TrendingDown, Target,
} from "lucide-react";
import { useDashboardSummary } from "../features/analytics/api.js";
import StatTile from "../components/ui/StatTile.jsx";
import GlassCard from "../components/ui/GlassCard.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import CandlestickStream from "../components/layout/CandlestickStream.jsx";

export default function Dashboard() {
  const { data, isLoading, isError } = useDashboardSummary();

  if (isLoading) return <Spinner label="Aggregating research metrics..." />;
  if (isError || !data) {
    return (
      <EmptyState
        title="Couldn't load dashboard data"
        description="Make sure the API server is running and MONGO_URI is configured in server/.env."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-xl overflow-hidden">
        <CandlestickStream height={56} />
        <div className="px-5 pb-4 pt-1">
          <h1 className="font-display text-2xl font-semibold">Mission Control</h1>
          <p className="text-ink-secondary text-sm mt-1">
            A live snapshot of every strategy, backtest, and research thread in the lab.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label="Total Strategies" value={data.totalStrategies} icon={FlaskConical} accent="cyan" />
        <StatTile label="Total Backtests" value={data.totalBacktests} icon={LineChart} accent="blue" />
        <StatTile label="Symbols Tested" value={data.totalSymbolsTested} icon={Globe2} accent="cyan" />
        <StatTile label="Avg Win Rate" value={data.averageWinRate} suffix="%" icon={Percent} accent="profit" />
        <StatTile label="Avg Profit Factor" value={data.averageProfitFactor} icon={TrendingUp} accent="profit" />
        <StatTile label="Best Performer" value={data.bestPerformingStrategy || "—"} icon={Trophy} accent="profit" />
        <StatTile label="Worst Performer" value={data.worstPerformingStrategy || "—"} icon={TrendingDown} accent="loss" />
        <StatTile label="Most Traded Symbol" value={data.mostTradedSymbol || "—"} icon={Target} accent="blue" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <GlassCard>
          <h2 className="font-display font-semibold mb-4">Strategy Status Breakdown</h2>
          <div className="space-y-2">
            {Object.entries(data.strategyStatusBreakdown || {}).length === 0 && (
              <p className="text-sm text-ink-secondary">No strategies yet.</p>
            )}
            {Object.entries(data.strategyStatusBreakdown || {}).map(([status, count]) => (
              <div key={status} className="flex items-center gap-3">
                <span className="text-sm w-20 text-ink-secondary">{status}</span>
                <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full bg-cyan"
                    style={{ width: `${(count / data.totalStrategies) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-mono w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <h2 className="font-display font-semibold mb-4">Strategy Type Breakdown</h2>
          <div className="space-y-2">
            {Object.entries(data.strategyTypeBreakdown || {}).length === 0 && (
              <p className="text-sm text-ink-secondary">No strategies yet.</p>
            )}
            {Object.entries(data.strategyTypeBreakdown || {}).map(([type, count]) => (
              <div key={type} className="flex items-center gap-3">
                <span className="text-sm w-36 text-ink-secondary truncate">{type}</span>
                <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full bg-signal-blue"
                    style={{ width: `${(count / data.totalStrategies) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-mono w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <GlassCard>
          <h2 className="font-display font-semibold mb-4">Recent Research Activity</h2>
          {data.recentResearchActivity?.length ? (
            <ul className="space-y-3">
              {data.recentResearchActivity.map((note) => (
                <li key={note._id} className="text-sm">
                  <Link to="/research-journal" className="text-ink-primary hover:text-cyan transition-colors font-medium">
                    {note.title}
                  </Link>
                  <div className="text-ink-secondary text-xs mt-0.5">
                    {note.type} · {note.strategy?.name || "General"} · {new Date(note.createdAt).toLocaleDateString()}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-secondary">No research notes logged yet.</p>
          )}
        </GlassCard>

        <GlassCard>
          <h2 className="font-display font-semibold mb-4">Recent Backtests</h2>
          {data.recentBacktests?.length ? (
            <ul className="space-y-3">
              {data.recentBacktests.map((bt) => (
                <li key={bt._id} className="text-sm flex items-center justify-between">
                  <div>
                    <Link to="/backtests" className="text-ink-primary hover:text-cyan transition-colors font-medium">
                      {bt.strategy?.name || "Untitled strategy"}
                    </Link>
                    <div className="text-ink-secondary text-xs mt-0.5">
                      {bt.symbol} · {bt.timeframe}
                    </div>
                  </div>
                  <span className="font-mono text-xs text-ink-secondary">
                    {new Date(bt.createdAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-secondary">No backtests logged yet.</p>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

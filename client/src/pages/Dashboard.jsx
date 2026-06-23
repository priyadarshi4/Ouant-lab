import { Link } from "react-router-dom";
import {
  FlaskConical, LineChart, Globe2, Percent, TrendingUp, Trophy, TrendingDown, Target,
  Zap, Briefcase, Sparkles, CheckSquare,
} from "lucide-react";
import { useDashboardSummary } from "../features/analytics/api.js";
import { usePortfolios } from "../features/portfolios/api.js";
import { usePaperAccounts } from "../features/paper/api.js";
import { useTasks } from "../features/tasks/api.js";
import { useStrategies } from "../features/strategies/api.js";
import StatTile from "../components/ui/StatTile.jsx";
import GlassCard from "../components/ui/GlassCard.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import CandlestickStream from "../components/layout/CandlestickStream.jsx";

const MATURITY_STAGES = ["Idea", "Prototype", "Backtested", "Validated", "Walk Forward Tested", "Paper Trading", "Live Candidate", "Live Ready"];
const STAGE_COLORS = { "Live Ready": "text-signal-profit", "Live Candidate": "text-signal-warn", "Paper Trading": "text-cyan", "Walk Forward Tested": "text-cyan", Validated: "text-cyan", Backtested: "text-signal-blue", Prototype: "text-ink-secondary", Idea: "text-ink-faint" };

export default function Dashboard() {
  const { data, isLoading, isError } = useDashboardSummary();
  const { data: portfoliosData } = usePortfolios();
  const { data: paperAccountsData } = usePaperAccounts();
  const { data: tasksData } = useTasks({ status: "Open" });
  const { data: strategiesData } = useStrategies();

  if (isLoading) return <Spinner label="Aggregating research metrics..." />;
  if (isError || !data) {
    return (
      <EmptyState
        title="Couldn't load dashboard data"
        description="Make sure the API server is running and MONGO_URI is configured in server/.env."
      />
    );
  }

  const strategies = strategiesData?.strategies || [];
  const maturityCounts = MATURITY_STAGES.reduce((acc, s) => ({ ...acc, [s]: 0 }), {});
  strategies.forEach((s) => { if (maturityCounts[s.maturityStage] !== undefined) maturityCounts[s.maturityStage]++; });

  const paperAccounts = paperAccountsData?.accounts || [];
  const openTasks = tasksData?.tasks || [];

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

      {/* Strategy Maturity Pipeline */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold">Strategy Maturity Pipeline</h2>
          <Link to="/strategies" className="text-cyan text-xs hover:underline">View all →</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
          {MATURITY_STAGES.map((stage) => (
            <div key={stage} className="text-center">
              <div className={`font-display text-xl font-semibold ${STAGE_COLORS[stage]}`}>{maturityCounts[stage]}</div>
              <div className="text-[10px] text-ink-secondary mt-0.5 leading-tight">{stage}</div>
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Paper Trading Status */}
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold flex items-center gap-2"><Zap size={16} className="text-cyan" /> Paper Trading</h2>
            <Link to="/paper-trading" className="text-cyan text-xs hover:underline">Manage →</Link>
          </div>
          {!paperAccounts.length ? (
            <p className="text-sm text-ink-secondary">No paper accounts yet. <Link to="/paper-trading" className="text-cyan hover:underline">Create one →</Link></p>
          ) : (
            <div className="space-y-2">
              {paperAccounts.slice(0, 4).map((acc) => (
                <div key={acc._id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{acc.name}</span>
                    <div className="text-[11px] text-ink-secondary">{acc.positions?.length || 0} open · {acc.closedTrades?.length || 0} closed</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-mono text-sm ${(acc.realizedPnl || 0) >= 0 ? "text-signal-profit" : "text-signal-loss"}`}>
                      {(acc.realizedPnl || 0) >= 0 ? "+" : ""}${acc.realizedPnl?.toFixed(2) || "0.00"}
                    </div>
                    <div className={`text-[10px] px-1.5 rounded-full ${acc.status === "active" ? "bg-signal-profit/15 text-signal-profit" : "bg-white/10 text-ink-faint"}`}>{acc.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Open Tasks */}
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold flex items-center gap-2"><CheckSquare size={16} className="text-cyan" /> Open Tasks ({openTasks.length})</h2>
            <Link to="/strategies" className="text-cyan text-xs hover:underline">All strategies →</Link>
          </div>
          {!openTasks.length ? (
            <p className="text-sm text-ink-secondary">No open tasks. Open a Strategy Workspace and click "AI Suggest Tasks" to generate a research to-do list.</p>
          ) : (
            <div className="space-y-2">
              {openTasks.slice(0, 5).map((task) => (
                <div key={task._id} className="flex items-start gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-cyan mt-1.5 shrink-0" />
                  <div>
                    <span className="text-ink-primary">{task.title}</span>
                    <span className="text-[10px] text-ink-faint ml-2">{task.type}</span>
                    {task.aiGenerated && <span className="text-[10px] text-cyan/50 ml-1">AI</span>}
                  </div>
                </div>
              ))}
              {openTasks.length > 5 && <p className="text-xs text-ink-secondary">+{openTasks.length - 5} more tasks</p>}
            </div>
          )}
        </GlassCard>
      </div>

      {/* Portfolio summary */}
      {portfoliosData?.portfolios?.length > 0 && (
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold flex items-center gap-2"><Briefcase size={16} className="text-cyan" /> Portfolios</h2>
            <Link to="/portfolio-lab" className="text-cyan text-xs hover:underline">Portfolio Lab →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {portfoliosData.portfolios.slice(0, 4).map((p) => (
              <div key={p._id} className="glass-panel rounded-lg px-3 py-2">
                <div className="font-medium text-sm truncate">{p.name}</div>
                <div className="text-xs text-ink-secondary">{p.constituents?.length || 0} strategies</div>
                <div className="text-xs text-ink-secondary">${p.totalCapital?.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}

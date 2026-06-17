import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Edit, Trash2, X } from "lucide-react";
import { useBacktest, useUpdateBacktest, useDeleteBacktest } from "../../features/backtests/api.js";
import GlassCard from "../../components/ui/GlassCard.jsx";
import StatTile from "../../components/ui/StatTile.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import MediaGallery from "../../components/ui/MediaGallery.jsx";
import EquityCurveChart from "../../components/charts/EquityCurveChart.jsx";
import DrawdownChart from "../../components/charts/DrawdownChart.jsx";
import MonthlyReturnHeatmap from "../../components/charts/MonthlyReturnHeatmap.jsx";
import YearlyReturnsChart from "../../components/charts/YearlyReturnsChart.jsx";
import RollingMetricsChart from "../../components/charts/RollingMetricsChart.jsx";

const BACKTEST_MEDIA_CATEGORIES = [
  "Equity Curve", "Drawdown Curve", "Monthly Returns", "Yearly Returns", "Distribution Curve",
  "Trade Distribution", "Monte Carlo Analysis", "Walk Forward Results", "Parameter Sensitivity",
  "Optimization Result", "TradingView Screenshot", "Performance Summary Screenshot", "List of Trades Screenshot", "Other",
];

const inputClass = "w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 focus:border-cyan/40 outline-none text-sm";

function MetricsEditForm({ backtest, onClose }) {
  const updateMutation = useUpdateBacktest();
  const [form, setForm] = useState({
    dateRangeStart: backtest.dateRangeStart?.slice(0, 10) || "",
    dateRangeEnd: backtest.dateRangeEnd?.slice(0, 10) || "",
    marketPhase: backtest.marketPhase || "Unspecified",
    dataSource: backtest.dataSource || "",
    positionSizingMethod: backtest.positionSizingMethod || "",
    metrics: { ...backtest.metrics },
  });

  const setMetric = (key, value) => setForm((f) => ({ ...f, metrics: { ...f.metrics, [key]: value === "" ? undefined : Number(value) } }));

  const PERFORMANCE_FIELDS = [
    "netProfit", "grossProfit", "grossLoss", "buyAndHoldReturn", "maxRunup", "maxDrawdown",
    "profitFactor", "winRate", "sharpeRatio", "sortinoRatio", "calmarRatio", "recoveryFactor",
    "expectancy", "averageTrade", "averageWin", "averageLoss", "largestWin", "largestLoss",
  ];
  const TRADE_FIELDS = [
    "totalTrades", "winningTrades", "losingTrades", "longTrades", "shortTrades",
    "longWinRate", "shortWinRate", "averageBarsInTrade", "averageHoldingDays", "averageHoldingHours",
    "consecutiveWins", "consecutiveLosses", "largestWinStreak", "largestLossStreak",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateMutation.mutateAsync({ id: backtest._id, ...form });
    onClose();
  };

  return (
    <GlassCard glow className="space-y-5">
      <div className="flex justify-between items-center">
        <h2 className="font-display font-semibold text-cyan">Edit Backtest Metrics</h2>
        <button onClick={onClose}><X size={18} className="text-ink-secondary" /></button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-ink-secondary mb-1">Start Date</label>
            <input type="date" className={inputClass} value={form.dateRangeStart} onChange={(e) => setForm({ ...form, dateRangeStart: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-ink-secondary mb-1">End Date</label>
            <input type="date" className={inputClass} value={form.dateRangeEnd} onChange={(e) => setForm({ ...form, dateRangeEnd: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-ink-secondary mb-1">Market Phase</label>
            <select className={inputClass} value={form.marketPhase} onChange={(e) => setForm({ ...form, marketPhase: e.target.value })}>
              {["Unspecified", "Bull", "Bear", "Sideways", "Mixed"].map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-ink-secondary mb-1">Data Source</label>
            <input className={inputClass} value={form.dataSource} onChange={(e) => setForm({ ...form, dataSource: e.target.value })} />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-display text-cyan mb-2">Performance Summary</h3>
          <div className="grid md:grid-cols-4 gap-3">
            {PERFORMANCE_FIELDS.map((key) => (
              <div key={key}>
                <label className="block text-[11px] text-ink-secondary mb-1 capitalize">{key.replace(/([A-Z])/g, " $1")}</label>
                <input type="number" step="0.01" className={inputClass} value={form.metrics[key] ?? ""} onChange={(e) => setMetric(key, e.target.value)} />
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-display text-cyan mb-2">Trade Statistics</h3>
          <div className="grid md:grid-cols-4 gap-3">
            {TRADE_FIELDS.map((key) => (
              <div key={key}>
                <label className="block text-[11px] text-ink-secondary mb-1 capitalize">{key.replace(/([A-Z])/g, " $1")}</label>
                <input type="number" step="0.01" className={inputClass} value={form.metrics[key] ?? ""} onChange={(e) => setMetric(key, e.target.value)} />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={updateMutation.isPending} className="px-5 py-2 rounded-md bg-cyan text-void font-display font-semibold text-sm hover:shadow-glow transition-shadow">
            Save Metrics
          </button>
        </div>
      </form>
    </GlassCard>
  );
}

export default function BacktestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useBacktest(id);
  const deleteMutation = useDeleteBacktest();
  const [editing, setEditing] = useState(false);

  if (isLoading) return <Spinner label="Loading backtest record..." />;
  if (!data?.backtest) return <EmptyState title="Backtest not found" />;

  const bt = data.backtest;
  const m = bt.metrics || {};

  const handleDelete = async () => {
    if (window.confirm("Delete this backtest? This cannot be undone.")) {
      await deleteMutation.mutateAsync(id);
      navigate("/backtests");
    }
  };

  const duration = bt.dateRangeStart && bt.dateRangeEnd
    ? `${Math.round((new Date(bt.dateRangeEnd) - new Date(bt.dateRangeStart)) / (1000 * 60 * 60 * 24))} days`
    : "—";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">
            <Link to={`/strategies/${bt.strategy?._id}`} className="hover:text-cyan transition-colors">{bt.strategy?.name}</Link>
            <span className="text-ink-secondary text-lg ml-2">· {bt.symbol}</span>
          </h1>
          <p className="text-ink-secondary text-sm mt-1">{bt.exchange} · {bt.timeframe} · {bt.marketPhase || "Unspecified"} regime</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditing((e) => !e)} className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-white/10 text-sm hover:border-cyan/40">
            <Edit size={14} /> Edit Metrics
          </button>
          <button onClick={handleDelete} className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-white/10 text-sm text-signal-loss hover:border-signal-loss/40">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      {editing && <MetricsEditForm backtest={bt} onClose={() => setEditing(false)} />}

      <GlassCard>
        <h2 className="font-display font-semibold mb-4">Date Information</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><div className="text-ink-secondary text-xs">Start</div>{bt.dateRangeStart ? new Date(bt.dateRangeStart).toLocaleDateString() : "—"}</div>
          <div><div className="text-ink-secondary text-xs">End</div>{bt.dateRangeEnd ? new Date(bt.dateRangeEnd).toLocaleDateString() : "—"}</div>
          <div><div className="text-ink-secondary text-xs">Duration</div>{duration}</div>
          <div><div className="text-ink-secondary text-xs">Data Source</div>{bt.dataSource || "—"}</div>
          <div><div className="text-ink-secondary text-xs">Initial Capital</div>{bt.initialCapital ?? "—"}</div>
          <div><div className="text-ink-secondary text-xs">Commission</div>{bt.commission ?? "—"}</div>
          <div><div className="text-ink-secondary text-xs">Slippage</div>{bt.slippage ?? "—"}</div>
          <div><div className="text-ink-secondary text-xs">Position Sizing</div>{bt.positionSizingMethod || bt.positionSize || "—"}</div>
        </div>
      </GlassCard>

      <div>
        <h2 className="font-display font-semibold mb-3">Performance Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <StatTile label="Net Profit" value={m.netProfit ?? "—"} accent="profit" />
          <StatTile label="Gross Profit" value={m.grossProfit ?? "—"} accent="profit" />
          <StatTile label="Gross Loss" value={m.grossLoss ?? "—"} accent="loss" />
          <StatTile label="Buy & Hold" value={m.buyAndHoldReturn ?? "—"} suffix="%" accent="blue" />
          <StatTile label="Max Runup" value={m.maxRunup ?? "—"} suffix="%" accent="profit" />
          <StatTile label="Max Drawdown" value={m.maxDrawdown ?? "—"} suffix="%" accent="loss" />
          <StatTile label="Profit Factor" value={m.profitFactor ?? "—"} accent="cyan" />
          <StatTile label="Win Rate" value={m.winRate ?? "—"} suffix="%" accent="profit" />
          <StatTile label="Sharpe" value={m.sharpeRatio ?? "—"} accent="cyan" />
          <StatTile label="Sortino" value={m.sortinoRatio ?? "—"} accent="cyan" />
          <StatTile label="Calmar" value={m.calmarRatio ?? "—"} accent="cyan" />
          <StatTile label="Recovery Factor" value={m.recoveryFactor ?? "—"} accent="blue" />
          <StatTile label="Expectancy" value={m.expectancy ?? "—"} accent="profit" />
          <StatTile label="Avg Trade" value={m.averageTrade ?? "—"} accent="blue" />
          <StatTile label="Avg Win" value={m.averageWin ?? "—"} accent="profit" />
          <StatTile label="Avg Loss" value={m.averageLoss ?? "—"} accent="loss" />
          <StatTile label="Largest Win" value={m.largestWin ?? "—"} accent="profit" />
          <StatTile label="Largest Loss" value={m.largestLoss ?? "—"} accent="loss" />
        </div>
      </div>

      <div>
        <h2 className="font-display font-semibold mb-3">Trade Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <StatTile label="Total Trades" value={m.totalTrades ?? "—"} accent="cyan" />
          <StatTile label="Winning" value={m.winningTrades ?? "—"} accent="profit" />
          <StatTile label="Losing" value={m.losingTrades ?? "—"} accent="loss" />
          <StatTile label="Long Trades" value={m.longTrades ?? "—"} accent="blue" />
          <StatTile label="Short Trades" value={m.shortTrades ?? "—"} accent="blue" />
          <StatTile label="Long Win Rate" value={m.longWinRate ?? "—"} suffix="%" accent="profit" />
          <StatTile label="Short Win Rate" value={m.shortWinRate ?? "—"} suffix="%" accent="profit" />
          <StatTile label="Avg Bars/Trade" value={m.averageBarsInTrade ?? "—"} accent="cyan" />
          <StatTile label="Avg Holding Days" value={m.averageHoldingDays ?? "—"} accent="cyan" />
          <StatTile label="Avg Holding Hours" value={m.averageHoldingHours ?? "—"} accent="cyan" />
          <StatTile label="Consecutive Wins" value={m.consecutiveWins ?? "—"} accent="profit" />
          <StatTile label="Consecutive Losses" value={m.consecutiveLosses ?? "—"} accent="loss" />
          <StatTile label="Largest Win Streak" value={m.largestWinStreak ?? "—"} accent="profit" />
          <StatTile label="Largest Loss Streak" value={m.largestLossStreak ?? "—"} accent="loss" />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <GlassCard>
          <h2 className="font-display font-semibold mb-3">Equity Curve</h2>
          <EquityCurveChart data={bt.equityCurve} />
        </GlassCard>
        <GlassCard>
          <h2 className="font-display font-semibold mb-3">Drawdown Curve</h2>
          <DrawdownChart data={bt.equityCurve} />
        </GlassCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <GlassCard>
          <h2 className="font-display font-semibold mb-3">Monthly Return Heatmap</h2>
          <MonthlyReturnHeatmap data={bt.monthlyReturns} />
        </GlassCard>
        <GlassCard>
          <h2 className="font-display font-semibold mb-3">Yearly Performance</h2>
          <YearlyReturnsChart data={bt.yearlyReturns} />
        </GlassCard>
      </div>

      <GlassCard>
        <h2 className="font-display font-semibold mb-3">Rolling Metrics</h2>
        <RollingMetricsChart data={bt.rollingMetrics} />
      </GlassCard>

      <GlassCard>
        <h2 className="font-display font-semibold mb-3">Media Gallery</h2>
        <MediaGallery relatedBacktest={bt._id} categories={BACKTEST_MEDIA_CATEGORIES} />
      </GlassCard>

      {bt.notes && (
        <GlassCard>
          <h2 className="font-display font-semibold mb-2">Notes</h2>
          <p className="text-sm text-ink-secondary whitespace-pre-wrap">{bt.notes}</p>
        </GlassCard>
      )}
    </div>
  );
}

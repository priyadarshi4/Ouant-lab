import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Edit, Trash2, X, ChevronDown, ChevronUp, Info } from "lucide-react";
import { useBacktest, useUpdateBacktest, useDeleteBacktest } from "../../features/backtests/api.js";
import GlassCard from "../../components/ui/GlassCard.jsx";
import StatTile from "../../components/ui/StatTile.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import Accordion from "../../components/ui/Accordion.jsx";
import MediaGallery from "../../components/ui/MediaGallery.jsx";
import SmartImport from "../../components/ui/SmartImport.jsx";
import EquityCurveChart from "../../components/charts/EquityCurveChart.jsx";
import DrawdownChart from "../../components/charts/DrawdownChart.jsx";
import MonthlyReturnHeatmap from "../../components/charts/MonthlyReturnHeatmap.jsx";
import YearlyReturnsChart from "../../components/charts/YearlyReturnsChart.jsx";
import RollingMetricsChart from "../../components/charts/RollingMetricsChart.jsx";

const BACKTEST_MEDIA_CATEGORIES = [
  "Equity Curve","Drawdown Curve","Monthly Returns","Yearly Returns","Distribution Curve",
  "Trade Distribution","Monte Carlo Analysis","Walk Forward Results","Parameter Sensitivity",
  "Optimization Result","TradingView Screenshot","Performance Summary Screenshot",
  "List of Trades Screenshot","Other",
];

const inputClass = "w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 focus:border-cyan/40 outline-none text-sm";

function EstimatedBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-signal-warn/10 border border-signal-warn/30 text-signal-warn text-[10px] font-medium uppercase tracking-wide">
      <Info size={10} /> Estimated
    </span>
  );
}

// ─── Manual metrics form, collapsible, shown below the SmartImport panel ─────
function ManualEditForm({ backtest, onClose }) {
  const updateMutation = useUpdateBacktest();
  const [form, setForm] = useState({
    symbol: backtest.symbol || "",
    timeframe: backtest.timeframe || "",
    exchange: backtest.exchange || "",
    dataSource: backtest.dataSource || "",
    marketPhase: backtest.marketPhase || "Unspecified",
    positionSizingMethod: backtest.positionSizingMethod || "",
    initialCapital: backtest.initialCapital ?? "",
    commission: backtest.commission ?? "",
    slippage: backtest.slippage ?? "",
    dateRangeStart: backtest.dateRangeStart?.slice(0, 10) || "",
    dateRangeEnd: backtest.dateRangeEnd?.slice(0, 10) || "",
    metrics: { ...(backtest.metrics || {}) },
  });

  const setM = (k, v) =>
    setForm((f) => ({ ...f, metrics: { ...f.metrics, [k]: v === "" ? undefined : Number(v) } }));

  const PERF = [
    ["netProfit","Net Profit"],["grossProfit","Gross Profit"],["grossLoss","Gross Loss"],
    ["buyAndHoldReturn","Buy & Hold %"],["maxRunup","Max Runup %"],["maxDrawdown","Max DD %"],
    ["profitFactor","Profit Factor"],["winRate","Win Rate %"],["sharpeRatio","Sharpe"],
    ["sortinoRatio","Sortino"],["calmarRatio","Calmar"],["recoveryFactor","Recovery Factor"],
    ["expectancy","Expectancy"],["averageTrade","Avg Trade"],["averageWin","Avg Win"],
    ["averageLoss","Avg Loss"],["largestWin","Largest Win"],["largestLoss","Largest Loss"],
  ];
  const TRADE = [
    ["totalTrades","Total Trades"],["winningTrades","Winning"],["losingTrades","Losing"],
    ["longTrades","Long"],["shortTrades","Short"],
    ["longWinRate","Long Win %"],["shortWinRate","Short Win %"],
    ["averageBarsInTrade","Avg Bars"],["averageHoldingDays","Avg Days"],
    ["averageHoldingHours","Avg Hours"],["consecutiveWins","Consec. Wins"],
    ["consecutiveLosses","Consec. Losses"],["largestWinStreak","Win Streak"],
    ["largestLossStreak","Loss Streak"],
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateMutation.mutateAsync({ id: backtest._id, ...form });
    onClose();
  };

  return (
    <GlassCard className="space-y-5">
      <div className="flex justify-between items-center">
        <h3 className="font-display font-semibold text-cyan">Manual Edit</h3>
        <button onClick={onClose}><X size={16} className="text-ink-secondary" /></button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-secondary mb-2">Setup</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {[["symbol","Symbol"],["timeframe","Timeframe"],["exchange","Exchange"],["dataSource","Data Source"]].map(([k,l]) => (
              <div key={k}>
                <label className="block text-[10px] text-ink-secondary mb-1">{l}</label>
                <input className={inputClass} value={form[k]||""} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} />
              </div>
            ))}
            <div>
              <label className="block text-[10px] text-ink-secondary mb-1">Start Date</label>
              <input type="date" className={inputClass} value={form.dateRangeStart} onChange={e=>setForm(f=>({...f,dateRangeStart:e.target.value}))} />
            </div>
            <div>
              <label className="block text-[10px] text-ink-secondary mb-1">End Date</label>
              <input type="date" className={inputClass} value={form.dateRangeEnd} onChange={e=>setForm(f=>({...f,dateRangeEnd:e.target.value}))} />
            </div>
            <div>
              <label className="block text-[10px] text-ink-secondary mb-1">Market Phase</label>
              <select className={inputClass} value={form.marketPhase} onChange={e=>setForm(f=>({...f,marketPhase:e.target.value}))}>
                {["Unspecified","Bull","Bear","Sideways","Mixed"].map(p=><option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-ink-secondary mb-1">Initial Capital</label>
              <input type="number" className={inputClass} value={form.initialCapital} onChange={e=>setForm(f=>({...f,initialCapital:e.target.value}))} />
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-ink-secondary mb-2">Performance Summary</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {PERF.map(([k,l])=>(
              <div key={k}>
                <label className="block text-[10px] text-ink-secondary mb-1">{l}</label>
                <input type="number" step="any" className={inputClass} value={form.metrics[k]??""} onChange={e=>setM(k,e.target.value)} />
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-ink-secondary mb-2">Trade Statistics</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {TRADE.map(([k,l])=>(
              <div key={k}>
                <label className="block text-[10px] text-ink-secondary mb-1">{l}</label>
                <input type="number" step="any" className={inputClass} value={form.metrics[k]??""} onChange={e=>setM(k,e.target.value)} />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={updateMutation.isPending}
            className="px-5 py-2 rounded-md bg-cyan text-void font-display font-semibold text-sm hover:shadow-glow transition-shadow disabled:opacity-60">
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </GlassCard>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function BacktestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, refetch } = useBacktest(id);
  const deleteMutation = useDeleteBacktest();
  const [showManual, setShowManual] = useState(false);

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
    ? `${Math.round((new Date(bt.dateRangeEnd) - new Date(bt.dateRangeStart)) / 86400000)} days`
    : "—";

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-semibold flex flex-wrap items-center gap-2">
            <Link to={`/strategies/${bt.strategy?._id}`} className="hover:text-cyan transition-colors">
              {bt.strategy?.name}
            </Link>
            <span className="text-ink-secondary font-normal text-lg">· {bt.symbol}</span>
          </h1>
          <p className="text-ink-secondary text-sm mt-1">
            {bt.exchange} · {bt.timeframe} · {bt.marketPhase || "Unspecified"} regime
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowManual(s => !s)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-white/10 text-sm hover:border-cyan/40">
            <Edit size={14} /> {showManual ? "Hide" : "Manual Edit"}
          </button>
          <button onClick={handleDelete}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-white/10 text-sm text-signal-loss hover:border-signal-loss/40">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      {/* ─── AI SMART IMPORT — the primary data-entry method ─────────────── */}
      <GlassCard glow>
        <SmartImport
          backtestId={id}
          hasStats={!!bt.metrics?.totalTrades}
          onComplete={() => refetch()}
        />
      </GlassCard>

      {/* Manual edit form — collapsible, for fine-tuning */}
      {showManual && (
        <ManualEditForm backtest={bt} onClose={() => { setShowManual(false); refetch(); }} />
      )}

      {/* Date Information */}
      <GlassCard>
        <h2 className="font-display font-semibold mb-3">Date Information</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div><div className="text-ink-secondary text-xs mb-0.5">Start</div>{bt.dateRangeStart ? new Date(bt.dateRangeStart).toLocaleDateString() : "—"}</div>
          <div><div className="text-ink-secondary text-xs mb-0.5">End</div>{bt.dateRangeEnd ? new Date(bt.dateRangeEnd).toLocaleDateString() : "—"}</div>
          <div><div className="text-ink-secondary text-xs mb-0.5">Duration</div>{duration}</div>
          <div><div className="text-ink-secondary text-xs mb-0.5">Data Source</div>{bt.dataSource || "—"}</div>
          <div><div className="text-ink-secondary text-xs mb-0.5">Initial Capital</div>{bt.initialCapital ?? "—"}</div>
          <div><div className="text-ink-secondary text-xs mb-0.5">Commission</div>{bt.commission ?? "—"}</div>
          <div><div className="text-ink-secondary text-xs mb-0.5">Slippage</div>{bt.slippage ?? "—"}</div>
          <div><div className="text-ink-secondary text-xs mb-0.5">Position Sizing</div>{bt.positionSizingMethod || bt.positionSize || "—"}</div>
        </div>
      </GlassCard>

      {/* Performance Summary */}
      <div>
        <h2 className="font-display font-semibold mb-3">Performance Summary</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
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

      {/* Trade Statistics */}
      <div>
        <h2 className="font-display font-semibold mb-3">Trade Statistics</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <StatTile label="Total Trades" value={m.totalTrades ?? "—"} accent="cyan" />
          <StatTile label="Winning" value={m.winningTrades ?? "—"} accent="profit" />
          <StatTile label="Losing" value={m.losingTrades ?? "—"} accent="loss" />
          <StatTile label="Long Trades" value={m.longTrades ?? "—"} accent="blue" />
          <StatTile label="Short Trades" value={m.shortTrades ?? "—"} accent="blue" />
          <StatTile label="Long Win %" value={m.longWinRate ?? "—"} suffix="%" accent="profit" />
          <StatTile label="Short Win %" value={m.shortWinRate ?? "—"} suffix="%" accent="profit" />
          <StatTile label="Avg Bars" value={m.averageBarsInTrade ?? "—"} accent="cyan" />
          <StatTile label="Avg Days" value={m.averageHoldingDays ?? "—"} accent="cyan" />
          <StatTile label="Avg Hours" value={m.averageHoldingHours ?? "—"} accent="cyan" />
          <StatTile label="Consec. Wins" value={m.consecutiveWins ?? "—"} accent="profit" />
          <StatTile label="Consec. Losses" value={m.consecutiveLosses ?? "—"} accent="loss" />
          <StatTile label="Win Streak" value={m.largestWinStreak ?? "—"} accent="profit" />
          <StatTile label="Loss Streak" value={m.largestLossStreak ?? "—"} accent="loss" />
        </div>
      </div>

      {/* Charts */}
      {bt.equityCurveSource === "estimated" && (
        <div className="flex items-start gap-2 px-4 py-2.5 rounded-lg bg-signal-warn/10 border border-signal-warn/30 text-signal-warn text-xs">
          <Info size={14} className="mt-0.5 shrink-0" />
          <span>
            The charts below are <strong>estimated</strong> from your saved Win Rate, Avg Win/Loss, and Net Profit —
            not real trade-by-trade history. Import a CSV from TradingView for exact figures.
          </span>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <GlassCard>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="font-display font-semibold">Equity Curve</h2>
            {bt.equityCurveSource === "estimated" && <EstimatedBadge />}
          </div>
          {bt.equityCurve?.length ? (
            <EquityCurveChart data={bt.equityCurve} />
          ) : (
            <p className="text-sm text-ink-secondary py-6 text-center">
              No equity curve data yet — use the "Import CSV" or "Generate Estimated Charts" option in the Smart Import panel above.
            </p>
          )}
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="font-display font-semibold">Drawdown Curve</h2>
            {bt.equityCurveSource === "estimated" && <EstimatedBadge />}
          </div>
          {bt.equityCurve?.length ? (
            <DrawdownChart data={bt.equityCurve} />
          ) : (
            <p className="text-sm text-ink-secondary py-6 text-center">Populated together with the equity curve above.</p>
          )}
        </GlassCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <GlassCard>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="font-display font-semibold">Monthly Return Heatmap</h2>
            {bt.equityCurveSource === "estimated" && <EstimatedBadge />}
          </div>
          <MonthlyReturnHeatmap data={bt.monthlyReturns} />
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="font-display font-semibold">Yearly Performance</h2>
            {bt.equityCurveSource === "estimated" && <EstimatedBadge />}
          </div>
          <YearlyReturnsChart data={bt.yearlyReturns} />
        </GlassCard>
      </div>

      <GlassCard>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="font-display font-semibold">Rolling Metrics</h2>
          {bt.equityCurveSource === "estimated" && <EstimatedBadge />}
        </div>
        <RollingMetricsChart data={bt.rollingMetrics} />
      </GlassCard>

      <GlassCard>
        <h2 className="font-display font-semibold mb-3">Media Gallery</h2>
        <p className="text-xs text-ink-secondary mb-3">Store TradingView screenshots, chart exports, and PDF reports alongside this backtest.</p>
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

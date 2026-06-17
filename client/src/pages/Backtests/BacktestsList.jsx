import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Plus, X } from "lucide-react";
import { useBacktests, useCreateBacktest, useDeleteBacktest } from "../../features/backtests/api.js";
import { useStrategies } from "../../features/strategies/api.js";
import GlassCard from "../../components/ui/GlassCard.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";

const inputClass = "w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 focus:border-cyan/40 outline-none text-sm";

const emptyForm = {
  strategy: "", exchange: "NSE", symbol: "", index: "", sector: "", timeframe: "1D",
  initialCapital: 100000, commission: 0.03, slippage: 0.02, positionSize: "1 lot",
  netProfit: "", winRate: "", profitFactor: "", maxDrawdown: "", sharpeRatio: "", totalTrades: "",
};

function NewBacktestForm({ onClose, strategies }) {
  const [form, setForm] = useState(emptyForm);
  const createMutation = useCreateBacktest();

  const handleChange = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createMutation.mutateAsync({
      strategy: form.strategy,
      exchange: form.exchange,
      symbol: form.symbol,
      index: form.index,
      sector: form.sector,
      timeframe: form.timeframe,
      initialCapital: Number(form.initialCapital),
      commission: Number(form.commission),
      slippage: Number(form.slippage),
      positionSize: form.positionSize,
      metrics: {
        netProfit: Number(form.netProfit) || 0,
        winRate: Number(form.winRate) || 0,
        profitFactor: Number(form.profitFactor) || 0,
        maxDrawdown: Number(form.maxDrawdown) || 0,
        sharpeRatio: Number(form.sharpeRatio) || 0,
        totalTrades: Number(form.totalTrades) || 0,
      },
    });
    onClose();
  };

  return (
    <GlassCard glow className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-display font-semibold text-cyan">Log New Backtest</h2>
        <button onClick={onClose}><X size={18} className="text-ink-secondary" /></button>
      </div>
      <form onSubmit={handleSubmit} className="grid md:grid-cols-3 gap-3">
        <select required className={inputClass} value={form.strategy} onChange={(e) => handleChange("strategy", e.target.value)}>
          <option value="">Select strategy...</option>
          {strategies?.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
        <input required placeholder="Symbol (e.g. NIFTY50)" className={inputClass} value={form.symbol} onChange={(e) => handleChange("symbol", e.target.value)} />
        <input placeholder="Timeframe (e.g. 15m, 1D)" className={inputClass} value={form.timeframe} onChange={(e) => handleChange("timeframe", e.target.value)} />
        <input placeholder="Exchange" className={inputClass} value={form.exchange} onChange={(e) => handleChange("exchange", e.target.value)} />
        <input placeholder="Initial Capital" type="number" className={inputClass} value={form.initialCapital} onChange={(e) => handleChange("initialCapital", e.target.value)} />
        <input placeholder="Position Size" className={inputClass} value={form.positionSize} onChange={(e) => handleChange("positionSize", e.target.value)} />

        <input placeholder="Net Profit" type="number" className={inputClass} value={form.netProfit} onChange={(e) => handleChange("netProfit", e.target.value)} />
        <input placeholder="Win Rate %" type="number" className={inputClass} value={form.winRate} onChange={(e) => handleChange("winRate", e.target.value)} />
        <input placeholder="Profit Factor" type="number" step="0.01" className={inputClass} value={form.profitFactor} onChange={(e) => handleChange("profitFactor", e.target.value)} />
        <input placeholder="Max Drawdown %" type="number" className={inputClass} value={form.maxDrawdown} onChange={(e) => handleChange("maxDrawdown", e.target.value)} />
        <input placeholder="Sharpe Ratio" type="number" step="0.01" className={inputClass} value={form.sharpeRatio} onChange={(e) => handleChange("sharpeRatio", e.target.value)} />
        <input placeholder="Total Trades" type="number" className={inputClass} value={form.totalTrades} onChange={(e) => handleChange("totalTrades", e.target.value)} />

        <div className="md:col-span-3 flex justify-end">
          <button type="submit" disabled={createMutation.isPending} className="px-5 py-2 rounded-md bg-cyan text-void font-display font-semibold text-sm hover:shadow-glow transition-shadow">
            Save Backtest
          </button>
        </div>
      </form>
    </GlassCard>
  );
}

export default function BacktestsList() {
  const [params] = useSearchParams();
  const strategyFilter = params.get("strategy") || "";
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useBacktests({ strategy: strategyFilter });
  const { data: strategiesData } = useStrategies();
  const deleteMutation = useDeleteBacktest();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Backtests</h1>
          <p className="text-ink-secondary text-sm mt-1">Every backtest run, with TradingView-style metrics.</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-cyan text-void font-display font-semibold text-sm hover:shadow-glow transition-shadow"
        >
          <Plus size={16} /> Log Backtest
        </button>
      </div>

      {showForm && <NewBacktestForm onClose={() => setShowForm(false)} strategies={strategiesData?.strategies} />}

      {isLoading ? (
        <Spinner />
      ) : !data?.backtests?.length ? (
        <EmptyState title="No backtests logged yet" description="Log your first backtest to start tracking performance metrics." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-secondary border-b border-white/10">
                <th className="py-2 pr-4">Strategy</th>
                <th className="py-2 pr-4">Symbol</th>
                <th className="py-2 pr-4">TF</th>
                <th className="py-2 pr-4">Net Profit</th>
                <th className="py-2 pr-4">Win Rate</th>
                <th className="py-2 pr-4">Profit Factor</th>
                <th className="py-2 pr-4">Max DD</th>
                <th className="py-2 pr-4">Sharpe</th>
                <th className="py-2 pr-4">Trades</th>
                <th className="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {data.backtests.map((bt) => (
                <tr key={bt._id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-2 pr-4">
                    <Link to={`/strategies/${bt.strategy?._id}`} className="hover:text-cyan">{bt.strategy?.name}</Link>
                  </td>
                  <td className="py-2 pr-4 font-mono">{bt.symbol}</td>
                  <td className="py-2 pr-4 font-mono">{bt.timeframe}</td>
                  <td className="py-2 pr-4 font-mono">{bt.metrics?.netProfit ?? "—"}</td>
                  <td className="py-2 pr-4 font-mono text-signal-profit">{bt.metrics?.winRate ?? "—"}%</td>
                  <td className="py-2 pr-4 font-mono text-cyan">{bt.metrics?.profitFactor ?? "—"}</td>
                  <td className="py-2 pr-4 font-mono text-signal-loss">{bt.metrics?.maxDrawdown ?? "—"}%</td>
                  <td className="py-2 pr-4 font-mono">{bt.metrics?.sharpeRatio ?? "—"}</td>
                  <td className="py-2 pr-4 font-mono">{bt.metrics?.totalTrades ?? "—"}</td>
                  <td className="py-2 pr-4">
                    <button onClick={() => deleteMutation.mutate(bt._id)} className="text-ink-faint hover:text-signal-loss text-xs">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

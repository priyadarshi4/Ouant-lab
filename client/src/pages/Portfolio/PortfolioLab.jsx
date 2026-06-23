import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Calculator, TrendingUp, BarChart3, X } from "lucide-react";
import {
  usePortfolios, useCreatePortfolio, useDeletePortfolio,
  usePortfolioAnalytics, useRegimeAnalysis, useComputeAllocation,
} from "../../features/portfolios/api.js";
import { useStrategies } from "../../features/strategies/api.js";
import GlassCard from "../../components/ui/GlassCard.jsx";
import StatTile from "../../components/ui/StatTile.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts";

const ALLOCATION_METHODS = ["Equal Weight", "Risk Parity", "Volatility Targeting", "Kelly", "Half Kelly"];
const inputClass = "w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 focus:border-cyan/40 outline-none text-sm";

function NewPortfolioForm({ strategies, onClose }) {
  const [form, setForm] = useState({ name: "", description: "", totalCapital: 100000, allocationMethod: "Equal Weight", constituents: [] });
  const createMutation = useCreatePortfolio();

  const toggleStrategy = (sid) => {
    setForm((f) => {
      const exists = f.constituents.find((c) => c.strategy === sid);
      const updated = exists
        ? f.constituents.filter((c) => c.strategy !== sid)
        : [...f.constituents, { strategy: sid, weight: 0.25, contracts: 1 }];
      return { ...f, constituents: updated };
    });
  };

  const setWeight = (sid, weight) => {
    setForm((f) => ({ ...f, constituents: f.constituents.map((c) => c.strategy === sid ? { ...c, weight: Number(weight) } : c) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createMutation.mutateAsync(form);
    onClose();
  };

  return (
    <GlassCard glow className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-display font-semibold text-cyan">New Portfolio</h2>
        <button onClick={onClose}><X size={18} className="text-ink-secondary" /></button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-ink-secondary mb-1">Portfolio Name</label>
            <input required className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-ink-secondary mb-1">Total Capital</label>
            <input type="number" className={inputClass} value={form.totalCapital} onChange={(e) => setForm({ ...form, totalCapital: Number(e.target.value) })} />
          </div>
          <div>
            <label className="block text-xs text-ink-secondary mb-1">Allocation Method</label>
            <select className={inputClass} value={form.allocationMethod} onChange={(e) => setForm({ ...form, allocationMethod: e.target.value })}>
              {ALLOCATION_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs text-ink-secondary mb-2">Select Strategies</label>
          <div className="grid md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {strategies?.map((s) => {
              const constituent = form.constituents.find((c) => c.strategy === s._id);
              return (
                <div key={s._id} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${constituent ? "border-cyan/40 bg-cyan/5" : "border-white/10"}`} onClick={() => toggleStrategy(s._id)}>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{s.name}</div>
                    <div className="text-[10px] text-ink-secondary">{s.strategyType}</div>
                  </div>
                  {constituent && (
                    <input
                      type="number" step="0.05" min="0.05" max="1"
                      value={constituent.weight}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setWeight(s._id, e.target.value)}
                      className="w-16 px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-right"
                    />
                  )}
                </div>
              );
            })}
          </div>
          {form.constituents.length > 0 && (
            <p className="text-[10px] text-ink-secondary mt-1">
              Weight sum: {form.constituents.reduce((s, c) => s + c.weight, 0).toFixed(2)} (adjust to sum ≤ 1)
            </p>
          )}
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={createMutation.isPending || !form.constituents.length} className="px-5 py-2 rounded-md bg-cyan text-void font-display font-semibold text-sm hover:shadow-glow disabled:opacity-50">
            Create Portfolio
          </button>
        </div>
      </form>
    </GlassCard>
  );
}

function PortfolioDetail({ portfolioId }) {
  const { data: analyticsData, isLoading: analyticsLoading } = usePortfolioAnalytics(portfolioId);
  const { data: regimeData } = useRegimeAnalysis(portfolioId);
  const allocationMutation = useComputeAllocation();
  const [allocationResult, setAllocationResult] = useState(null);
  const [method, setMethod] = useState("Equal Weight");

  const a = analyticsData?.analytics;

  const handleAllocate = async () => {
    const result = await allocationMutation.mutateAsync({ id: portfolioId, method });
    setAllocationResult(result);
  };

  const regimes = (regimeData?.regimes || []).filter((r) => r.count > 0);

  return (
    <div className="space-y-5">
      {analyticsLoading ? <Spinner /> : !a ? (
        <p className="text-sm text-ink-secondary">Add strategies with logged backtests to see analytics.</p>
      ) : (
        <>
          <p className="text-xs text-ink-secondary italic">{analyticsData.methodologyNote}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatTile label="Total Return" value={a.totalReturn} suffix="%" accent="profit" />
            <StatTile label="Sharpe" value={a.sharpeRatio} accent="cyan" />
            <StatTile label="Sortino" value={a.sortinoRatio} accent="cyan" />
            <StatTile label="Calmar" value={a.calmarRatio} accent="cyan" />
            <StatTile label="Max Drawdown" value={a.maxDrawdown} suffix="%" accent="loss" />
            <StatTile label="MAR" value={a.mar} accent="blue" />
            <StatTile label="Ulcer Index" value={a.ulcerIndex} accent="warn" />
            <StatTile label="Risk of Ruin" value={a.riskOfRuin} suffix="%" accent="loss" />
            <StatTile label="Profit Factor" value={a.profitFactor} accent="profit" />
            <StatTile label="Expectancy" value={a.expectedPayoff} accent="blue" />
            <StatTile label="Portfolio Exposure" value={a.portfolioExposure} suffix="%" accent="cyan" />
            <StatTile label="Total $ Return" value={`$${a.totalReturnAmount?.toLocaleString()}`} accent="profit" />
          </div>

          {a.perStrategy?.length > 0 && (
            <GlassCard>
              <h3 className="font-display font-semibold mb-3">Per-Strategy Contribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={a.perStrategy}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" stroke="#7C93B3" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#7C93B3" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "#0B0F17", border: "1px solid rgba(0,229,255,0.2)", borderRadius: 8 }} />
                  <Bar dataKey="returnPct" name="Return %" radius={[3, 3, 0, 0]}>
                    {a.perStrategy.map((p, i) => <Cell key={i} fill={p.returnPct >= 0 ? "#00FF94" : "#FF3864"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </GlassCard>
          )}
        </>
      )}

      {regimes.length > 0 && (
        <GlassCard>
          <h3 className="font-display font-semibold mb-3">Market Regime Analysis</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-ink-secondary border-b border-white/10">
                <th className="py-2 pr-4">Regime</th>
                <th className="py-2 pr-4">Backtests</th>
                <th className="py-2 pr-4">Avg Win Rate</th>
                <th className="py-2 pr-4">Avg Profit Factor</th>
                <th className="py-2 pr-4">Avg Return</th>
              </tr></thead>
              <tbody>
                {regimes.map((r) => (
                  <tr key={r.regime} className="border-b border-white/5">
                    <td className="py-2 pr-4">{r.regime}</td>
                    <td className="py-2 pr-4 font-mono">{r.count}</td>
                    <td className="py-2 pr-4 font-mono text-signal-profit">{r.avgWinRate}%</td>
                    <td className="py-2 pr-4 font-mono text-cyan">{r.avgProfitFactor}</td>
                    <td className="py-2 pr-4 font-mono" style={{ color: r.avgReturn >= 0 ? "#00FF94" : "#FF3864" }}>{r.avgReturn}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      <GlassCard className="space-y-3">
        <h3 className="font-display font-semibold text-cyan">Capital Allocation Engine</h3>
        <div className="flex items-center gap-3 flex-wrap">
          <select value={method} onChange={(e) => setMethod(e.target.value)} className={inputClass + " max-w-xs"}>
            {ALLOCATION_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <button onClick={handleAllocate} disabled={allocationMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-cyan text-void font-display font-semibold text-sm hover:shadow-glow transition-shadow disabled:opacity-50">
            <Calculator size={14} /> {allocationMutation.isPending ? "Computing..." : "Compute Allocation"}
          </button>
        </div>
        {allocationResult && (
          <div className="overflow-x-auto pt-2">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-ink-secondary border-b border-white/10">
                <th className="py-2 pr-4">Strategy</th>
                <th className="py-2 pr-4">Weight</th>
                <th className="py-2 pr-4">Suggested Capital</th>
              </tr></thead>
              <tbody>
                {allocationResult.allocation?.map((a) => (
                  <tr key={a.strategyId} className="border-b border-white/5">
                    <td className="py-2 pr-4">{a.name}</td>
                    <td className="py-2 pr-4 font-mono text-cyan">{(a.suggestedWeight * 100).toFixed(1)}%</td>
                    <td className="py-2 pr-4 font-mono text-signal-profit">${a.suggestedCapital?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

export default function PortfolioLab() {
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const { data, isLoading } = usePortfolios();
  const { data: strategiesData } = useStrategies();
  const deleteMutation = useDeletePortfolio();
  const portfolios = data?.portfolios || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Portfolio Lab</h1>
          <p className="text-ink-secondary text-sm mt-1">Construct multi-strategy portfolios with regime analysis and allocation optimization.</p>
        </div>
        <button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-2 px-4 py-2 rounded-md bg-cyan text-void font-display font-semibold text-sm hover:shadow-glow transition-shadow">
          <Plus size={16} /> New Portfolio
        </button>
      </div>

      {showForm && <NewPortfolioForm strategies={strategiesData?.strategies} onClose={() => setShowForm(false)} />}

      {isLoading ? <Spinner /> : !portfolios.length && !showForm ? (
        <EmptyState title="No portfolios yet" description="Build a portfolio to see blended analytics, regime performance, and optimal capital allocation across your strategies." />
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {portfolios.map((p) => (
            <GlassCard key={p._id} className={`cursor-pointer transition-all ${selected === p._id ? "border-cyan/40 shadow-glow" : "hover:border-white/20"}`}
              onClick={() => setSelected(selected === p._id ? null : p._id)}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-display font-semibold">{p.name}</h3>
                  <p className="text-xs text-ink-secondary mt-0.5">{p.constituents?.length || 0} strategies · {p.allocationMethod}</p>
                  <p className="text-xs text-ink-secondary">Capital: ${p.totalCapital?.toLocaleString()}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(p._id); }}
                  className="text-ink-faint hover:text-signal-loss">
                  <Trash2 size={14} />
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {selected && (
        <div className="space-y-2">
          <h2 className="font-display font-semibold text-cyan">
            {portfolios.find((p) => p._id === selected)?.name} — Analytics
          </h2>
          <PortfolioDetail portfolioId={selected} />
        </div>
      )}
    </div>
  );
}

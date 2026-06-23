import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2, Zap, Send, BookOpen, Sparkles, Copy, X, CheckCircle } from "lucide-react";
import {
  usePaperAccounts, useCreatePaperAccount, useDeletePaperAccount,
  usePaperAccount, useManualSignal, useSignals, useTradeJournal,
  useUpdateJournalEntry, useAiReviewTrade,
} from "../../features/paper/api.js";
import { useStrategies } from "../../features/strategies/api.js";
import GlassCard from "../../components/ui/GlassCard.jsx";
import StatTile from "../../components/ui/StatTile.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import EquityCurveChart from "../../components/charts/EquityCurveChart.jsx";

const inputClass = "w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 focus:border-cyan/40 outline-none text-sm";
const MARKETS = ["ES", "NQ", "YM", "RTY", "GC", "SI", "CL", "NG", "BTCUSD", "ETHUSD", "EURUSD", "GBPUSD", "USDJPY", "NIFTY50", "BANKNIFTY"];
const EMOTIONS = ["Confident", "Anxious", "FOMO", "Disciplined", "Impulsive", "Neutral", "Frustrated", "Relieved"];

function NewAccountForm({ strategies, onClose }) {
  const [form, setForm] = useState({ name: "", initialCapital: 100000, commissionPerContract: 2.5, slippageTicks: 1, strategy: "" });
  const createMutation = useCreatePaperAccount();
  const handleSubmit = async (e) => {
    e.preventDefault();
    await createMutation.mutateAsync(form);
    onClose();
  };
  return (
    <GlassCard glow className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-display font-semibold text-cyan">New Paper Account</h2>
        <button onClick={onClose}><X size={18} className="text-ink-secondary" /></button>
      </div>
      <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <label className="block text-xs text-ink-secondary mb-1">Account Name</label>
          <input required className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="RSI Strategy Paper Account" />
        </div>
        <div>
          <label className="block text-xs text-ink-secondary mb-1">Initial Capital</label>
          <input type="number" className={inputClass} value={form.initialCapital} onChange={(e) => setForm({ ...form, initialCapital: Number(e.target.value) })} />
        </div>
        <div>
          <label className="block text-xs text-ink-secondary mb-1">Commission / Contract</label>
          <input type="number" step="0.5" className={inputClass} value={form.commissionPerContract} onChange={(e) => setForm({ ...form, commissionPerContract: Number(e.target.value) })} />
        </div>
        <div>
          <label className="block text-xs text-ink-secondary mb-1">Slippage Ticks</label>
          <input type="number" className={inputClass} value={form.slippageTicks} onChange={(e) => setForm({ ...form, slippageTicks: Number(e.target.value) })} />
        </div>
        <div>
          <label className="block text-xs text-ink-secondary mb-1">Linked Strategy (optional)</label>
          <select className={inputClass} value={form.strategy} onChange={(e) => setForm({ ...form, strategy: e.target.value })}>
            <option value="">None</option>
            {strategies?.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </div>
        <div className="md:col-span-2 flex justify-end">
          <button type="submit" disabled={createMutation.isPending} className="px-5 py-2 rounded-md bg-cyan text-void font-display font-semibold text-sm hover:shadow-glow disabled:opacity-50">
            Create Account
          </button>
        </div>
      </form>
    </GlassCard>
  );
}

function ManualSignalForm({ accountId }) {
  const [form, setForm] = useState({ market: "NIFTY50", direction: "long", price: "", quantity: 1, signalType: "entry" });
  const signalMutation = useManualSignal(accountId);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = await signalMutation.mutateAsync({ ...form, price: Number(form.price) });
    setResult(data);
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <select className={inputClass} value={form.market} onChange={(e) => setForm({ ...form, market: e.target.value })}>
          {MARKETS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select className={inputClass} value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })}>
          {["long", "short", "close", "flat"].map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <input required type="number" step="any" placeholder="Price" className={inputClass} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        <input type="number" min="1" placeholder="Qty" className={inputClass} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
        <button type="submit" disabled={signalMutation.isPending} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-cyan text-void text-sm font-medium hover:shadow-glow disabled:opacity-50">
          <Send size={13} /> {signalMutation.isPending ? "..." : "Send"}
        </button>
      </form>
      {result && (
        <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-md border ${result.status === "blocked" ? "border-signal-loss/30 text-signal-loss bg-signal-loss/10" : "border-signal-profit/30 text-signal-profit bg-signal-profit/10"}`}>
          {result.status === "blocked" ? `Blocked: ${result.reason}` : `Routed · PnL this trade: ${result.pnl?.toFixed(2)}`}
        </div>
      )}
    </div>
  );
}

function TradeJournalPanel({ accountId }) {
  const { data, isLoading } = useTradeJournal(accountId);
  const updateMutation = useUpdateJournalEntry(accountId);
  const aiReviewMutation = useAiReviewTrade(accountId);
  const [expanded, setExpanded] = useState(null);
  const [editForm, setEditForm] = useState({});

  const entries = data?.entries || [];

  const handleExpand = (entry) => {
    setExpanded(expanded === entry._id ? null : entry._id);
    setEditForm({ reason: entry.reason || "", notes: entry.notes || "", mistakes: entry.mistakes || "", lessonsLearned: entry.lessonsLearned || "", emotion: entry.emotion || "Neutral" });
  };

  const handleSave = async (entryId) => {
    await updateMutation.mutateAsync({ entryId, ...editForm });
    setExpanded(null);
  };

  if (isLoading) return <Spinner />;
  if (!entries.length) return <EmptyState title="No trade journal entries yet" description="Journal entries are auto-created when a signal closes a position. Add your reflections after each trade." />;

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <GlassCard key={entry._id} className="space-y-3">
          <button onClick={() => handleExpand(entry)} className="w-full flex items-center justify-between">
            <div className="text-left">
              <div className="flex items-center gap-3 text-sm">
                <span className={`font-mono font-semibold ${entry.pnl >= 0 ? "text-signal-profit" : "text-signal-loss"}`}>
                  {entry.pnl >= 0 ? "+" : ""}{entry.pnl?.toFixed(2)}
                </span>
                <span className="text-ink-secondary">{entry.market} · {entry.direction} · {entry.entryPrice} → {entry.exitPrice}</span>
              </div>
              <div className="text-[11px] text-ink-secondary mt-0.5">{new Date(entry.createdAt).toLocaleString()} · {entry.emotion}</div>
            </div>
          </button>

          {expanded === entry._id && (
            <div className="space-y-3 pt-2 border-t border-white/10">
              {[["reason", "Reason / Thesis"], ["notes", "Notes"], ["mistakes", "Mistakes"], ["lessonsLearned", "Lessons Learned"]].map(([key, label]) => (
                <div key={key}>
                  <label className="block text-xs text-ink-secondary mb-1">{label}</label>
                  <textarea className={`${inputClass} min-h-[60px]`} value={editForm[key] || ""} onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })} />
                </div>
              ))}
              <div>
                <label className="block text-xs text-ink-secondary mb-1">Emotion</label>
                <select className={inputClass} value={editForm.emotion} onChange={(e) => setEditForm({ ...editForm, emotion: e.target.value })}>
                  {EMOTIONS.map((em) => <option key={em} value={em}>{em}</option>)}
                </select>
              </div>
              {entry.aiReview && (
                <div className="px-3 py-2 rounded-md bg-cyan/5 border border-cyan/20">
                  <div className="text-xs text-cyan mb-1 flex items-center gap-1"><Sparkles size={11} /> AI Coach Review</div>
                  <p className="text-xs text-ink-secondary">{entry.aiReview}</p>
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => handleSave(entry._id)} disabled={updateMutation.isPending} className="px-4 py-1.5 rounded-md bg-cyan text-void text-sm font-medium">Save</button>
                <button onClick={() => aiReviewMutation.mutate(entry._id)} disabled={aiReviewMutation.isPending} className="flex items-center gap-1.5 px-4 py-1.5 rounded-md border border-cyan/30 text-cyan text-sm">
                  <Sparkles size={13} /> {aiReviewMutation.isPending ? "Reviewing..." : "AI Review"}
                </button>
              </div>
            </div>
          )}
        </GlassCard>
      ))}
    </div>
  );
}

function WebhookSetup({ account }) {
  const [copied, setCopied] = useState(false);
  const webhookUrl = `${window.location.origin.replace(":5173", ":5000")}/api/paper/webhook/${account.webhookToken}`;

  const copy = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <GlassCard className="space-y-3">
      <h3 className="font-display font-semibold text-cyan">TradingView Webhook Setup</h3>
      <p className="text-xs text-ink-secondary">Create a TradingView Alert → set "Webhook URL" to the address below → use this JSON as the message body.</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 text-xs bg-black/30 px-3 py-2 rounded-md font-mono truncate text-cyan">{webhookUrl}</code>
        <button onClick={copy} className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-white/10 text-xs text-ink-secondary hover:border-cyan/40">
          {copied ? <CheckCircle size={13} className="text-signal-profit" /> : <Copy size={13} />} {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="text-xs bg-black/30 px-3 py-2 rounded-md text-ink-secondary overflow-x-auto">{`{
  "market": "NIFTY50",
  "direction": "{{strategy.order.action}}",
  "price": {{close}},
  "quantity": 1,
  "signalType": "entry"
}`}</pre>
      <p className="text-xs text-ink-secondary">direction should be "long", "short", or "close". The server auto-handles commission, slippage, and risk limits.</p>
    </GlassCard>
  );
}

function AccountDashboard({ accountId }) {
  const { data, isLoading } = usePaperAccount(accountId);
  const { data: signalsData } = useSignals(accountId);
  const [view, setView] = useState("dashboard");
  const deleteMutation = useDeletePaperAccount();

  if (isLoading) return <Spinner />;
  if (!data?.account) return <EmptyState title="Account not found" />;
  const acc = data.account;
  const drawdownPct = acc.peakEquity > 0 ? ((acc.equity - acc.peakEquity) / acc.peakEquity) * 100 : 0;
  const signals = signalsData?.signals || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="font-display text-xl font-semibold">{acc.name}</h2>
          <p className="text-xs text-ink-secondary">{acc.strategy?.name || "No linked strategy"} · {acc.status}</p>
        </div>
        <div className="flex gap-2">
          {["dashboard", "signals", "journal", "webhook"].map((v) => (
            <button key={v} onClick={() => setView(v)} className={`text-xs px-3 py-1.5 rounded-md border capitalize ${view === v ? "border-cyan text-cyan bg-cyan/10" : "border-white/10 text-ink-secondary"}`}>{v}</button>
          ))}
        </div>
      </div>

      {view === "dashboard" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatTile label="Equity" value={`$${acc.equity?.toLocaleString()}`} accent="profit" />
            <StatTile label="Realized PnL" value={`$${acc.realizedPnl?.toFixed(2)}`} accent={acc.realizedPnl >= 0 ? "profit" : "loss"} />
            <StatTile label="Open Positions" value={acc.positions?.length || 0} accent="cyan" />
            <StatTile label="Closed Trades" value={acc.closedTrades?.length || 0} accent="blue" />
            <StatTile label="Drawdown" value={drawdownPct.toFixed(2)} suffix="%" accent="loss" />
            <StatTile label="Capital" value={`$${acc.capital?.toLocaleString()}`} accent="blue" />
            <StatTile label="Initial Capital" value={`$${acc.initialCapital?.toLocaleString()}`} accent="cyan" />
            <StatTile label="Peak Equity" value={`$${acc.peakEquity?.toLocaleString()}`} accent="profit" />
          </div>

          {acc.positions?.length > 0 && (
            <GlassCard>
              <h3 className="font-display font-semibold mb-3">Open Positions</h3>
              <div className="space-y-2">
                {acc.positions.map((p) => (
                  <div key={p._id} className="flex items-center justify-between text-sm">
                    <div><span className="font-mono text-cyan">{p.market}</span> · <span className={p.direction === "long" ? "text-signal-profit" : "text-signal-loss"}>{p.direction}</span></div>
                    <div className="font-mono text-ink-secondary">Qty: {p.quantity} · Avg: {p.avgPrice?.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {acc.equityCurve?.length > 0 && (
            <GlassCard>
              <h3 className="font-display font-semibold mb-3">Paper Equity Curve</h3>
              <EquityCurveChart data={acc.equityCurve} />
            </GlassCard>
          )}

          <GlassCard>
            <h3 className="font-display font-semibold mb-3">Send Manual Signal</h3>
            <ManualSignalForm accountId={accountId} />
          </GlassCard>
        </div>
      )}

      {view === "signals" && (
        <GlassCard>
          <h3 className="font-display font-semibold mb-3">Signal History ({signals.length})</h3>
          {!signals.length ? <p className="text-sm text-ink-secondary">No signals yet. Send one via TradingView webhook or the manual form.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="text-left text-ink-secondary border-b border-white/10">
                  <th className="py-2 pr-3">Time</th><th className="py-2 pr-3">Market</th>
                  <th className="py-2 pr-3">Direction</th><th className="py-2 pr-3">Price</th>
                  <th className="py-2 pr-3">Qty</th><th className="py-2 pr-3">Status</th>
                </tr></thead>
                <tbody>
                  {signals.slice(0, 50).map((s) => (
                    <tr key={s._id} className="border-b border-white/5">
                      <td className="py-1.5 pr-3 text-ink-faint">{new Date(s.timestamp).toLocaleTimeString()}</td>
                      <td className="py-1.5 pr-3 font-mono text-cyan">{s.market}</td>
                      <td className="py-1.5 pr-3" style={{ color: s.direction === "long" ? "#00FF94" : s.direction === "short" ? "#FF3864" : "#7C93B3" }}>{s.direction}</td>
                      <td className="py-1.5 pr-3 font-mono">{s.price}</td>
                      <td className="py-1.5 pr-3 font-mono">{s.quantity}</td>
                      <td className="py-1.5 pr-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${s.status === "routed" ? "bg-signal-profit/10 text-signal-profit" : "bg-signal-loss/10 text-signal-loss"}`}>{s.status}</span>
                        {s.blockReason && <span className="ml-1 text-ink-faint">{s.blockReason}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      )}

      {view === "journal" && <TradeJournalPanel accountId={accountId} />}
      {view === "webhook" && <WebhookSetup account={acc} />}
    </div>
  );
}

export default function PaperTradingOS() {
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const { data, isLoading } = usePaperAccounts();
  const { data: strategiesData } = useStrategies();
  const deleteMutation = useDeletePaperAccount();
  const accounts = data?.accounts || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Paper Trading OS</h1>
          <p className="text-ink-secondary text-sm mt-1">Full execution simulation — TradingView webhook → signal router → risk engine → trade journal.</p>
        </div>
        <button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-2 px-4 py-2 rounded-md bg-cyan text-void font-display font-semibold text-sm hover:shadow-glow transition-shadow">
          <Plus size={16} /> New Account
        </button>
      </div>

      {showForm && <NewAccountForm strategies={strategiesData?.strategies} onClose={() => setShowForm(false)} />}

      {isLoading ? <Spinner /> : !accounts.length && !showForm ? (
        <EmptyState title="No paper accounts yet" description="Create a paper account, grab the webhook URL, and hook it up to a TradingView strategy alert." />
      ) : (
        <div className="flex gap-3 flex-wrap">
          {accounts.map((acc) => (
            <button key={acc._id} onClick={() => setSelected(selected === acc._id ? null : acc._id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md border text-sm transition-colors ${selected === acc._id ? "border-cyan text-cyan bg-cyan/10" : "border-white/10 text-ink-secondary hover:border-white/20"}`}>
              <Zap size={14} /> {acc.name}
              <span className={`text-[10px] px-1.5 rounded-full ${acc.status === "active" ? "bg-signal-profit/20 text-signal-profit" : "bg-white/10 text-ink-faint"}`}>{acc.status}</span>
            </button>
          ))}
        </div>
      )}

      {selected && <AccountDashboard accountId={selected} />}
    </div>
  );
}

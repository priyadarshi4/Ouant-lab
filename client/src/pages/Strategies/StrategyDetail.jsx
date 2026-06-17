import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Tabs, Tab } from "@mui/material";
import { Edit, Trash2, Star } from "lucide-react";
import {
  useStrategy, useDeleteStrategy, useToggleFavorite, useUpdateScorecard,
} from "../../features/strategies/api.js";
import { useResearchNotes } from "../../features/research/api.js";
import GlassCard from "../../components/ui/GlassCard.jsx";
import StatusPill from "../../components/ui/StatusPill.jsx";
import GradeBadge from "../../components/ui/GradeBadge.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";

function DocBlock({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <h4 className="text-xs uppercase tracking-wide text-cyan/80 mb-1">{label.replace(/([A-Z])/g, " $1")}</h4>
      <p className="text-sm text-ink-primary whitespace-pre-wrap">{value}</p>
    </div>
  );
}

function ScoreSlider({ label, value, onChange }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-ink-secondary mb-1">
        <span>{label}</span>
        <span className="font-mono">{value}</span>
      </div>
      <input type="range" min={0} max={100} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-cyan" />
    </div>
  );
}

export default function StrategyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const { data, isLoading } = useStrategy(id);
  const { data: notesData } = useResearchNotes({ strategy: id });
  const deleteMutation = useDeleteStrategy();
  const toggleFavorite = useToggleFavorite();
  const updateScorecard = useUpdateScorecard();

  if (isLoading) return <Spinner label="Loading strategy research record..." />;
  if (!data?.strategy) return <EmptyState title="Strategy not found" />;

  const { strategy, backtests } = data;
  const sc = strategy.scorecard || {};

  const handleDelete = async () => {
    if (window.confirm(`Delete "${strategy.name}" and all its backtests? This cannot be undone.`)) {
      await deleteMutation.mutateAsync(id);
      navigate("/strategies");
    }
  };

  const handleScore = (key, value) => {
    updateScorecard.mutate({ id, [key]: value });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display text-2xl font-semibold">{strategy.name}</h1>
            <StatusPill status={strategy.status} />
            <GradeBadge grade={sc.grade} />
          </div>
          <p className="text-ink-secondary text-sm mt-1">
            {strategy.strategyType} · {strategy.version} · by {strategy.author?.name || "Unknown"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => toggleFavorite.mutate(id)} className="p-2 rounded-md border border-white/10 hover:border-signal-warn/40">
            <Star size={16} className={strategy.isFavorite ? "fill-signal-warn text-signal-warn" : "text-ink-faint"} />
          </button>
          <Link to={`/strategies/${id}/edit`} className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-white/10 text-sm hover:border-cyan/40">
            <Edit size={14} /> Edit
          </Link>
          <button onClick={handleDelete} className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-white/10 text-sm text-signal-loss hover:border-signal-loss/40">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
        <Tab label="Overview" />
        <Tab label="Entry / Exit" />
        <Tab label="Risk & Trailing Stop" />
        <Tab label="Backtests" />
        <Tab label="Research Notes" />
        <Tab label="Scorecard" />
      </Tabs>

      {tab === 0 && (
        <GlassCard className="space-y-5">
          <p className="text-sm text-ink-secondary">{strategy.description}</p>
          {Object.entries(strategy.documentation || {}).map(([key, value]) => (
            <DocBlock key={key} label={key} value={value} />
          ))}
        </GlassCard>
      )}

      {tab === 1 && (
        <div className="grid md:grid-cols-2 gap-4">
          <GlassCard className="space-y-4">
            <h2 className="font-display font-semibold text-cyan">Entry Conditions</h2>
            {Object.entries(strategy.entryConditions || {}).map(([key, value]) => (
              <DocBlock key={key} label={key} value={value} />
            ))}
          </GlassCard>
          <GlassCard className="space-y-4">
            <h2 className="font-display font-semibold text-cyan">Exit Conditions</h2>
            {Object.entries(strategy.exitConditions || {}).map(([key, value]) => (
              <DocBlock key={key} label={key} value={value} />
            ))}
          </GlassCard>
        </div>
      )}

      {tab === 2 && (
        <div className="grid md:grid-cols-2 gap-4">
          <GlassCard className="space-y-4">
            <h2 className="font-display font-semibold text-cyan">Risk Management</h2>
            {Object.entries(strategy.riskManagement || {}).map(([key, value]) => (
              <DocBlock key={key} label={key} value={value} />
            ))}
          </GlassCard>
          <GlassCard className="space-y-4">
            <h2 className="font-display font-semibold text-cyan">Trailing Stop System</h2>
            <DocBlock label="Logic Type" value={strategy.trailingStop?.logicType} />
            <DocBlock label="Custom Formula" value={strategy.trailingStop?.customFormula} />
            <DocBlock label="Notes" value={strategy.trailingStop?.notes} />
          </GlassCard>
        </div>
      )}

      {tab === 3 && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Link to={`/backtests?strategy=${id}`} className="text-cyan text-sm hover:underline">
              Manage backtests for this strategy →
            </Link>
          </div>
          {!backtests?.length ? (
            <EmptyState title="No backtests yet" description="Log a backtest from the Backtests page to start tracking metrics." />
          ) : (
            backtests.map((bt) => (
              <GlassCard key={bt._id} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{bt.symbol} · {bt.timeframe}</div>
                  <div className="text-xs text-ink-secondary">{new Date(bt.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="flex gap-6 text-sm font-mono">
                  <span>Win Rate <span className="text-signal-profit">{bt.metrics?.winRate ?? "—"}%</span></span>
                  <span>PF <span className="text-cyan">{bt.metrics?.profitFactor ?? "—"}</span></span>
                  <span>Max DD <span className="text-signal-loss">{bt.metrics?.maxDrawdown ?? "—"}%</span></span>
                </div>
              </GlassCard>
            ))
          )}
        </div>
      )}

      {tab === 4 && (
        <div className="space-y-3">
          {!notesData?.notes?.length ? (
            <EmptyState title="No research notes for this strategy yet" />
          ) : (
            notesData.notes.map((note) => (
              <GlassCard key={note._id}>
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-medium">{note.title}</h3>
                  <span className="text-xs text-ink-secondary">{note.type}</span>
                </div>
                <p className="text-sm text-ink-secondary whitespace-pre-wrap">{note.content}</p>
              </GlassCard>
            ))
          )}
        </div>
      )}

      {tab === 5 && (
        <GlassCard className="space-y-5 max-w-xl">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-cyan">Quant Scorecard</h2>
            <GradeBadge grade={sc.grade} />
          </div>
          <ScoreSlider label="Profitability Score" value={sc.profitabilityScore || 0} onChange={(v) => handleScore("profitabilityScore", v)} />
          <ScoreSlider label="Robustness Score" value={sc.robustnessScore || 0} onChange={(v) => handleScore("robustnessScore", v)} />
          <ScoreSlider label="Consistency Score" value={sc.consistencyScore || 0} onChange={(v) => handleScore("consistencyScore", v)} />
          <ScoreSlider label="Risk Score" value={sc.riskScore || 0} onChange={(v) => handleScore("riskScore", v)} />
          <ScoreSlider label="Complexity Score" value={sc.complexityScore || 0} onChange={(v) => handleScore("complexityScore", v)} />
          <div className="pt-3 border-t border-white/10 flex items-center justify-between">
            <span className="text-sm text-ink-secondary">Final Quant Score</span>
            <span className="font-display text-2xl text-cyan">{sc.finalQuantScore || 0}</span>
          </div>
        </GlassCard>
      )}
    </div>
  );
}

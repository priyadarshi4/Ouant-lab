import { useNavigate, useParams, Link } from "react-router-dom";
import { Edit, Trash2, Star, FlaskConical, Calendar, User as UserIcon } from "lucide-react";
import {
  useStrategy, useDeleteStrategy, useToggleFavorite, useUpdateScorecard,
} from "../../features/strategies/api.js";
import { useResearchNotes } from "../../features/research/api.js";
import { useCodeVersions } from "../../features/code/api.js";
import GlassCard from "../../components/ui/GlassCard.jsx";
import StatusPill from "../../components/ui/StatusPill.jsx";
import GradeBadge from "../../components/ui/GradeBadge.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import Accordion from "../../components/ui/Accordion.jsx";
import MediaGallery from "../../components/ui/MediaGallery.jsx";
import VersionHistoryPanel from "../../components/ui/VersionHistoryPanel.jsx";
import MathBlock from "../../components/math/MathBlock.jsx";

const STRATEGY_MEDIA_CATEGORIES = [
  "Strategy Diagram", "Market Structure Diagram", "Flowchart", "Signal Example",
  "Entry Example", "Exit Example", "Annotated Chart", "Other",
];

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

function ScoreDial({ label, value, color }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16">
        <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
          <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15.5" fill="none" stroke={color} strokeWidth="3"
            strokeDasharray={`${(value / 100) * 97.4} 97.4`} strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-display text-sm" style={{ color }}>{value}</div>
      </div>
      <span className="text-[11px] text-ink-secondary text-center">{label}</span>
    </div>
  );
}

export default function StrategyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useStrategy(id);
  const { data: notesData } = useResearchNotes({ strategy: id });
  const { data: codeData } = useCodeVersions(id);
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

  const handleScore = (key, value) => updateScorecard.mutate({ id, [key]: value });

  return (
    <div className="space-y-6 max-w-4xl">
      {/* --- Cover / Header --- */}
      <GlassCard glow className="space-y-4">
        {strategy.coverImageUrl && (
          <img src={strategy.coverImageUrl} alt={strategy.name} className="w-full h-48 object-cover rounded-lg" />
        )}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display text-2xl font-semibold">{strategy.name}</h1>
              <StatusPill status={strategy.status} />
              <GradeBadge grade={sc.grade} />
            </div>
            <div className="flex items-center gap-4 text-sm text-ink-secondary mt-2 flex-wrap">
              <span className="flex items-center gap-1"><FlaskConical size={14} /> {strategy.strategyType} · {strategy.version}</span>
              <span className="flex items-center gap-1"><UserIcon size={14} /> {strategy.author?.name || "Unknown"}</span>
              <span className="flex items-center gap-1"><Calendar size={14} /> Updated {new Date(strategy.updatedAt).toLocaleDateString()}</span>
            </div>
            {strategy.tags?.length > 0 && (
              <div className="flex gap-1.5 flex-wrap mt-2">
                {strategy.tags.map((t) => <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 text-ink-secondary">#{t}</span>)}
              </div>
            )}
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

        <div className="flex items-center gap-6 pt-2 border-t border-white/10">
          <ScoreDial label="Research Score" value={strategy.researchScore || 0} color="#00E5FF" />
          <ScoreDial label="Quant Score" value={sc.finalQuantScore || 0} color="#00FF94" />
        </div>
      </GlassCard>

      <Accordion title="1. Executive Summary" defaultOpen>
        <p className="text-sm text-ink-primary whitespace-pre-wrap">{strategy.executiveSummary || strategy.description || "Not documented yet."}</p>
      </Accordion>

      <Accordion title="2. Core Idea">
        <DocBlock label="Core Idea" value={strategy.documentation?.coreIdea} />
      </Accordion>

      <Accordion title="3. Market Hypothesis">
        <DocBlock label="Hypothesis" value={strategy.documentation?.hypothesis} />
        <DocBlock label="Market Logic" value={strategy.documentation?.marketLogic} />
      </Accordion>

      <Accordion title="4. Philosophy">
        <DocBlock label="Philosophy" value={strategy.documentation?.philosophy} />
      </Accordion>

      <Accordion title="5. Market Inefficiency">
        <DocBlock label="Market Inefficiency Exploited" value={strategy.documentation?.marketInefficiencyExploited} />
      </Accordion>

      <Accordion title="6. Edge Explanation">
        <DocBlock label="Edge Explanation" value={strategy.documentation?.edgeExplanation} />
        <DocBlock label="Why It Should Work" value={strategy.documentation?.whyItShouldWork} />
      </Accordion>

      <Accordion title="7. Entry Logic">
        {Object.entries(strategy.entryConditions || {}).map(([key, value]) => (
          <DocBlock key={key} label={key} value={value} />
        ))}
      </Accordion>

      <Accordion title="8. Exit Logic">
        {Object.entries(strategy.exitConditions || {}).map(([key, value]) => (
          <DocBlock key={key} label={key} value={value} />
        ))}
      </Accordion>

      <Accordion title="9. Risk Management">
        {Object.entries(strategy.riskManagement || {}).map(([key, value]) => (
          <DocBlock key={key} label={key} value={value} />
        ))}
        <DocBlock label="Trailing Stop Logic" value={strategy.trailingStop?.logicType} />
        <DocBlock label="Trailing Stop Formula" value={strategy.trailingStop?.customFormula} />
      </Accordion>

      <Accordion title="10. Position Sizing">
        <DocBlock label="Position Sizing Formula" value={strategy.riskManagement?.positionSizingFormula} />
        {strategy.mathematicalFramework?.filter((f) => /position|size|risk/i.test(f.label)).map((f) => (
          <MathBlock key={f._id} latex={f.latex} label={f.label} note={f.note} />
        ))}
      </Accordion>

      <Accordion title="11. Failure Conditions">
        <p className="text-sm text-ink-primary whitespace-pre-wrap">{strategy.failureConditions || strategy.documentation?.whenItFails || "Not documented yet."}</p>
      </Accordion>

      <Accordion title="12. Market Regimes">
        <p className="text-sm text-ink-primary whitespace-pre-wrap mb-3">{strategy.marketRegimes || "Not documented yet."}</p>
        <DocBlock label="Behavior During Crashes" value={strategy.documentation?.behaviorDuringCrashes} />
        <DocBlock label="Behavior During Bull Markets" value={strategy.documentation?.behaviorDuringBullMarkets} />
        <DocBlock label="Behavior During Sideways Markets" value={strategy.documentation?.behaviorDuringSidewaysMarkets} />
      </Accordion>

      <Accordion title="13. Research Notes" badge={<span className="text-xs text-ink-secondary">({notesData?.notes?.length || 0})</span>}>
        {!notesData?.notes?.length ? (
          <p className="text-sm text-ink-secondary">No research notes for this strategy yet.</p>
        ) : (
          <div className="space-y-3">
            {notesData.notes.map((note) => (
              <div key={note._id} className="border-b border-white/5 pb-3">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-medium text-sm">{note.title}</h4>
                  <span className="text-xs text-ink-secondary">{note.type}</span>
                </div>
                <p className="text-sm text-ink-secondary whitespace-pre-wrap">{note.content}</p>
              </div>
            ))}
          </div>
        )}
      </Accordion>

      <Accordion title="14. Mathematical Framework" badge={<span className="text-xs text-ink-secondary">({strategy.mathematicalFramework?.length || 0})</span>}>
        {!strategy.mathematicalFramework?.length ? (
          <p className="text-sm text-ink-secondary">No formulas documented yet. Add some from the Edit page.</p>
        ) : (
          <div className="space-y-4">
            {strategy.mathematicalFramework.map((f) => (
              <MathBlock key={f._id} latex={f.latex} label={f.label} note={f.note} />
            ))}
          </div>
        )}
      </Accordion>

      <Accordion title="15. Code Repository" badge={<span className="text-xs text-ink-secondary">({codeData?.versions?.length || 0})</span>}>
        {!codeData?.versions?.length ? (
          <p className="text-sm text-ink-secondary">No Pine Script versions logged yet.</p>
        ) : (
          <div className="space-y-2">
            {codeData.versions.slice(0, 5).map((v) => (
              <div key={v._id} className="flex items-center justify-between text-sm border-b border-white/5 pb-2">
                <span className="font-mono text-cyan">{v.versionLabel}</span>
                <span className="text-ink-secondary text-xs">{v.language} · {new Date(v.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
        <Link to="/code-repository" className="text-cyan text-sm hover:underline">Open full Code Repository →</Link>
      </Accordion>

      <Accordion title="16. Backtest Results" badge={<span className="text-xs text-ink-secondary">({backtests?.length || 0})</span>}>
        {!backtests?.length ? (
          <EmptyState title="No backtests yet" description="Log a backtest from the Backtests page to start tracking metrics." />
        ) : (
          <div className="space-y-2">
            {backtests.map((bt) => (
              <Link to={`/backtests/${bt._id}`} key={bt._id} className="flex items-center justify-between hover:bg-white/5 rounded-md px-2 py-2 -mx-2 transition-colors">
                <div>
                  <div className="font-medium text-sm">{bt.symbol} · {bt.timeframe}</div>
                  <div className="text-xs text-ink-secondary">{new Date(bt.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="flex gap-4 text-sm font-mono">
                  <span className="text-signal-profit">{bt.metrics?.winRate ?? "—"}%</span>
                  <span className="text-cyan">{bt.metrics?.profitFactor ?? "—"}</span>
                  <span className="text-signal-loss">{bt.metrics?.maxDrawdown ?? "—"}%</span>
                </div>
              </Link>
            ))}
          </div>
        )}
        <Link to={`/backtests?strategy=${id}`} className="text-cyan text-sm hover:underline">Manage backtests for this strategy →</Link>
      </Accordion>

      <Accordion title="17. Visual Analysis">
        <MediaGallery relatedStrategy={id} categories={STRATEGY_MEDIA_CATEGORIES} />
      </Accordion>

      <Accordion title="18. Conclusion">
        <p className="text-sm text-ink-primary whitespace-pre-wrap">{strategy.conclusion || "Not documented yet."}</p>
      </Accordion>

      <Accordion title="Version History">
        <VersionHistoryPanel strategyId={id} />
      </Accordion>

      <Accordion title="Quant Scorecard">
        <div className="space-y-5 max-w-xl">
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink-secondary">Component scores feed the final grade</span>
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
        </div>
      </Accordion>
    </div>
  );
}

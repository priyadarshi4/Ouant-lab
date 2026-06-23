import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Tabs, Tab } from "@mui/material";
import { motion } from "framer-motion";
import {
  FlaskConical, NotebookPen, Code2, LineChart, BarChart3, FileText,
  Sparkles, ClipboardList, Clock, Share2, Paperclip, CheckSquare,
  TrendingUp, RefreshCw, ChevronRight, Star, Wand2,
} from "lucide-react";

import { useStrategy } from "../../features/strategies/api.js";
import { useResearchNotes, useCreateResearchNote } from "../../features/research/api.js";
import { useTimeline } from "../../features/timeline/api.js";
import { useTasks, useCreateTask, useUpdateTask, useSuggestTasks } from "../../features/tasks/api.js";
import { useCodeVersions } from "../../features/code/api.js";
import { useOptimizationRuns } from "../../features/optimizations/api.js";
import { useGenerateAiAnalysis, useAnalyzePineScript, useApplyPineScriptAnalysis } from "../../features/pine/api.js";
import { useQuery } from "@tanstack/react-query";
import axiosClient from "../../api/axiosClient.js";

import GlassCard from "../../components/ui/GlassCard.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import StatusPill from "../../components/ui/StatusPill.jsx";
import GradeBadge from "../../components/ui/GradeBadge.jsx";
import MathBlock from "../../components/math/MathBlock.jsx";
import Accordion from "../../components/ui/Accordion.jsx";
import MediaGallery from "../../components/ui/MediaGallery.jsx";

// ─── Maturity bar ─────────────────────────────────────────────────────────────
const STAGES = ["Idea", "Prototype", "Backtested", "Validated", "Walk Forward Tested", "Paper Trading", "Live Candidate", "Live Ready"];
const STAGE_COLORS = { "Idea": "bg-ink-faint", "Prototype": "bg-signal-blue", "Backtested": "bg-cyan", "Validated": "bg-cyan", "Walk Forward Tested": "bg-signal-profit", "Paper Trading": "bg-signal-profit", "Live Candidate": "bg-signal-warn", "Live Ready": "bg-signal-profit" };

function MaturityBar({ stage }) {
  const idx = STAGES.indexOf(stage);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] text-ink-secondary">
        <span>Idea</span><span className="text-cyan font-medium">{stage}</span><span>Live Ready</span>
      </div>
      <div className="flex gap-0.5">
        {STAGES.map((s, i) => (
          <div key={s} className={`h-2 flex-1 rounded-sm transition-all ${i <= idx ? (STAGE_COLORS[stage] || "bg-cyan") : "bg-white/10"}`} title={s} />
        ))}
      </div>
    </div>
  );
}

// ─── Sub-panels ──────────────────────────────────────────────────────────────
function TimelinePanel({ strategyId }) {
  const { data, isLoading } = useTimeline(strategyId);
  if (isLoading) return <Spinner label="Loading timeline..." />;
  const events = data?.events || [];
  if (!events.length) return <p className="text-sm text-ink-secondary">No events recorded yet.</p>;
  return (
    <div className="relative pl-5 space-y-4">
      <div className="absolute left-1.5 top-2 bottom-2 w-px bg-cyan/20" />
      {events.map((ev) => (
        <div key={ev._id} className="relative">
          <div className="absolute -left-5 top-1.5 w-3 h-3 rounded-full bg-cyan/25 border-2 border-cyan" />
          <div className="text-sm font-medium">{ev.message}</div>
          <div className="text-[11px] text-ink-secondary mt-0.5">
            {ev.type} · {new Date(ev.createdAt).toLocaleString()} {ev.actor?.name ? `· ${ev.actor.name}` : ""}
          </div>
        </div>
      ))}
    </div>
  );
}

function TasksPanel({ strategyId }) {
  const { data, isLoading } = useTasks({ strategy: strategyId });
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const suggestTasks = useSuggestTasks();
  const [form, setForm] = useState({ title: "", type: "Research Task" });

  const tasks = data?.tasks || [];
  const open = tasks.filter((t) => t.status !== "Done");
  const done = tasks.filter((t) => t.status === "Done");

  const handleCreate = async (e) => {
    e.preventDefault();
    await createTask.mutateAsync({ ...form, strategy: strategyId });
    setForm({ title: "", type: "Research Task" });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm text-ink-secondary">{open.length} open · {done.length} done</span>
        <button
          onClick={() => suggestTasks.mutate(strategyId)}
          disabled={suggestTasks.isPending}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-cyan/30 text-cyan hover:bg-cyan/10 transition-colors"
        >
          <Sparkles size={12} /> {suggestTasks.isPending ? "Suggesting..." : "AI Suggest Tasks"}
        </button>
      </div>

      <form onSubmit={handleCreate} className="flex gap-2">
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="px-2 py-1.5 rounded-md bg-white/5 border border-white/10 text-xs outline-none">
          {["Research Task", "Validation Task", "Risk Task", "Optimization Task", "Open Question"].map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Add a task..." className="flex-1 px-3 py-1.5 rounded-md bg-white/5 border border-white/10 text-sm outline-none focus:border-cyan/40" />
        <button type="submit" disabled={createTask.isPending} className="px-3 py-1.5 rounded-md bg-cyan text-void text-sm font-medium">Add</button>
      </form>

      {isLoading ? <Spinner /> : (
        <div className="space-y-2">
          {open.map((task) => (
            <div key={task._id} className="flex items-center gap-3 group">
              <button onClick={() => updateTask.mutate({ id: task._id, status: "Done" })} className="w-4 h-4 rounded border border-white/20 hover:border-cyan/40 flex-shrink-0 group-hover:border-cyan/40" />
              <div className="flex-1 min-w-0">
                <span className="text-sm">{task.title}</span>
                {task.aiGenerated && <span className="ml-2 text-[10px] text-cyan/60">AI</span>}
              </div>
              <span className="text-[10px] text-ink-faint">{task.type}</span>
            </div>
          ))}
          {done.length > 0 && (
            <div className="pt-2 border-t border-white/5 space-y-1">
              {done.slice(0, 3).map((task) => (
                <div key={task._id} className="flex items-center gap-3 opacity-40">
                  <CheckSquare size={14} className="text-signal-profit shrink-0" />
                  <span className="text-sm line-through">{task.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AiAnalystPanel({ strategy }) {
  const generateAnalysis = useGenerateAiAnalysis();
  const a = strategy.aiAnalysis || {};
  const hasAnalysis = !!a.executiveSummary;

  const SECTIONS = [
    ["executiveSummary", "Executive Summary"], ["strengths", "Strengths"], ["weaknesses", "Weaknesses"],
    ["riskAssessment", "Risk Assessment"], ["failureRegimes", "Failure Regimes"], ["robustnessAnalysis", "Robustness Analysis"],
    ["overfittingAssessment", "Overfitting Assessment"], ["marketSuitability", "Market Suitability"],
    ["positionSizingSuggestions", "Position Sizing"], ["portfolioSuitability", "Portfolio Suitability"],
    ["potentialImprovements", "Potential Improvements"], ["expectedFutureRisks", "Expected Future Risks"],
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {hasAnalysis && a.generatedAt && (
          <span className="text-xs text-ink-secondary">Last run: {new Date(a.generatedAt).toLocaleString()}</span>
        )}
        <button onClick={() => generateAnalysis.mutate(strategy._id)} disabled={generateAnalysis.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-cyan text-void font-display font-semibold text-sm hover:shadow-glow transition-shadow disabled:opacity-60">
          <Sparkles size={14} /> {generateAnalysis.isPending ? "Analyzing..." : hasAnalysis ? "Regenerate Analysis" : "Run AI Analysis"}
        </button>
      </div>

      {!hasAnalysis && !generateAnalysis.isPending && (
        <div className="glass-panel rounded-xl py-12 text-center text-ink-secondary text-sm">
          Click "Run AI Analysis" to get a professional quant review of this strategy's documentation, backtest results, and research notes.
        </div>
      )}
      {generateAnalysis.isError && (
        <div className="px-4 py-3 rounded-lg bg-signal-loss/10 border border-signal-loss/30 text-signal-loss text-sm">
          {generateAnalysis.error?.response?.data?.message || "Analysis failed — check your GEMINI_API_KEY in server/.env"}
        </div>
      )}
      {hasAnalysis && (
        <div className="space-y-3">
          {SECTIONS.map(([key, label]) => a[key] ? (
            <div key={key} className="glass-panel rounded-lg px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-cyan/80 mb-1">{label}</div>
              <p className="text-sm text-ink-primary">{a[key]}</p>
            </div>
          ) : null)}
        </div>
      )}
    </div>
  );
}

function PineAnalysisPanel({ strategy }) {
  const [code, setCode] = useState("");
  const analyzeMutation = useAnalyzePineScript();
  const applyMutation = useApplyPineScriptAnalysis();
  const a = strategy.pineScriptAnalysis || {};
  const hasAnalysis = !!a.plainEnglishExplanation;

  const handleAnalyze = async () => {
    await analyzeMutation.mutateAsync({ code, strategyId: strategy._id });
    setCode("");
  };

  return (
    <div className="space-y-4">
      <GlassCard className="space-y-3">
        <h3 className="font-display font-semibold text-cyan">Pine Script Intelligence Engine</h3>
        <p className="text-xs text-ink-secondary">Paste Pine Script and Gemini will extract indicators, entry/exit logic, edge hypothesis, and weaknesses — then optionally auto-populate the strategy's documentation fields.</p>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="//@version=6&#10;strategy(...)&#10;// paste your full Pine Script here"
          className="w-full min-h-[160px] px-3 py-2 rounded-md bg-black/30 border border-white/10 focus:border-cyan/40 outline-none text-sm font-mono resize-y"
        />
        <button onClick={handleAnalyze} disabled={!code.trim() || analyzeMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-cyan text-void font-display font-semibold text-sm hover:shadow-glow transition-shadow disabled:opacity-60">
          <Wand2 size={14} /> {analyzeMutation.isPending ? "Analyzing..." : "Analyze Pine Script"}
        </button>
      </GlassCard>

      {hasAnalysis && (
        <div className="space-y-3">
          {a.generatedAt && <p className="text-xs text-ink-secondary">Last analyzed: {new Date(a.generatedAt).toLocaleString()}</p>}
          {[
            ["Indicators Used", a.indicators?.join(", ")],
            ["Parameters", a.parameters],
            ["Entry Conditions", a.entryConditions],
            ["Exit Conditions", a.exitConditions],
            ["Risk Management", a.riskManagement],
            ["Position Sizing", a.positionSizing],
            ["Timeframes", a.timeframes],
            ["Market Type", a.marketType],
            ["Plain English Explanation", a.plainEnglishExplanation],
            ["Trading Hypothesis", a.tradingHypothesis],
            ["Expected Edge", a.expectedEdge],
            ["Possible Weaknesses", a.possibleWeaknesses],
            ["Suggested Improvements", a.suggestedImprovements],
          ].filter(([, v]) => v).map(([label, value]) => (
            <div key={label} className="glass-panel rounded-lg px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-cyan/80 mb-1">{label}</div>
              <p className="text-sm text-ink-primary">{value}</p>
            </div>
          ))}
          {!a.appliedToStrategy && (
            <button onClick={() => applyMutation.mutate(strategy._id)} disabled={applyMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-md border border-cyan/30 text-cyan text-sm hover:bg-cyan/10 transition-colors">
              <ChevronRight size={14} /> {applyMutation.isPending ? "Applying..." : "Auto-apply to Strategy Documentation"}
            </button>
          )}
          {a.appliedToStrategy && <p className="text-xs text-signal-profit">✓ Applied to strategy documentation</p>}
        </div>
      )}
    </div>
  );
}

function SimilarStrategiesPanel({ strategyId }) {
  const { data, isLoading } = useQuery({
    queryKey: ["similar-strategies", strategyId],
    queryFn: async () => (await axiosClient.get(`/analytics/similar-strategies/${strategyId}`)).data,
    enabled: !!strategyId,
  });
  if (isLoading) return <Spinner />;
  const similar = data?.similar || [];
  if (!similar.length) return <p className="text-sm text-ink-secondary">No similar strategies found. Add more strategies to the lab to see connections.</p>;
  return (
    <div className="space-y-2">
      {similar.map((s) => (
        <Link to={`/workspace/${s.id}`} key={s.id} className="flex items-center justify-between glass-panel rounded-lg px-4 py-3 hover:border-cyan/30 transition-colors">
          <div>
            <div className="font-medium text-sm">{s.name}</div>
            <div className="text-xs text-ink-secondary mt-0.5">{s.reasons.join(" · ")}</div>
          </div>
          <div className="text-right">
            <div className="font-mono text-cyan text-sm">{s.score}%</div>
            <div className="text-[10px] text-ink-secondary">similarity</div>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ─── Main Workspace ───────────────────────────────────────────────────────────
const WORKSPACE_TABS = [
  { label: "Overview", icon: FlaskConical },
  { label: "Research", icon: NotebookPen },
  { label: "Backtests", icon: LineChart },
  { label: "Code", icon: Code2 },
  { label: "Pine AI", icon: Wand2 },
  { label: "AI Analyst", icon: Sparkles },
  { label: "Tasks", icon: ClipboardList },
  { label: "Timeline", icon: Clock },
  { label: "Similar", icon: Share2 },
  { label: "Media", icon: Paperclip },
];

export default function StrategyWorkspace() {
  const { id } = useParams();
  const [tab, setTab] = useState(0);
  const { data, isLoading, refetch } = useStrategy(id);

  if (isLoading) return <Spinner label="Loading strategy workspace..." />;
  if (!data?.strategy) return <EmptyState title="Strategy not found" />;

  const { strategy, backtests } = data;

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-xl p-5 space-y-3">
        {strategy.coverImageUrl && (
          <img src={strategy.coverImageUrl} alt={strategy.name} className="w-full h-36 object-cover rounded-lg mb-3" />
        )}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-xl font-semibold">{strategy.name}</h1>
              <StatusPill status={strategy.status} />
              <GradeBadge grade={strategy.scorecard?.grade} />
            </div>
            <p className="text-ink-secondary text-sm mt-1">{strategy.strategyType} · {strategy.version} · {strategy.author?.name}</p>
          </div>
          <div className="flex gap-2">
            <Link to={`/strategies/${id}/edit`} className="text-xs px-3 py-1.5 rounded-md border border-white/10 hover:border-cyan/40">Edit</Link>
            <Link to={`/backtests?strategy=${id}`} className="text-xs px-3 py-1.5 rounded-md border border-white/10 hover:border-cyan/40">Log Backtest</Link>
          </div>
        </div>
        <MaturityBar stage={strategy.maturityStage || "Idea"} />
        <div className="flex gap-4 text-xs text-ink-secondary pt-1">
          <span>Research Score: <span className="text-cyan">{strategy.researchScore || 0}</span></span>
          <span>Quant Score: <span className="text-signal-profit">{strategy.scorecard?.finalQuantScore || 0}</span></span>
          <span>Backtests: <span className="text-ink-primary">{backtests?.length || 0}</span></span>
        </div>
      </motion.div>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
        {WORKSPACE_TABS.map(({ label, icon: Icon }) => (
          <Tab key={label} label={<span className="flex items-center gap-1.5 text-xs"><Icon size={13} />{label}</span>} />
        ))}
      </Tabs>

      <div className="min-h-[400px]">
        {tab === 0 && (
          <div className="space-y-3">
            {strategy.executiveSummary && <GlassCard><p className="text-sm text-ink-primary">{strategy.executiveSummary}</p></GlassCard>}
            <div className="grid md:grid-cols-2 gap-3">
              {strategy.documentation?.coreIdea && <Accordion title="Core Idea" defaultOpen><p className="text-sm text-ink-primary">{strategy.documentation.coreIdea}</p></Accordion>}
              {strategy.documentation?.hypothesis && <Accordion title="Hypothesis"><p className="text-sm text-ink-primary">{strategy.documentation.hypothesis}</p></Accordion>}
              {strategy.documentation?.edgeExplanation && <Accordion title="Edge Explanation"><p className="text-sm text-ink-primary">{strategy.documentation.edgeExplanation}</p></Accordion>}
              {strategy.failureConditions && <Accordion title="Failure Conditions"><p className="text-sm text-ink-primary">{strategy.failureConditions}</p></Accordion>}
            </div>
            {strategy.mathematicalFramework?.length > 0 && (
              <Accordion title="Mathematical Framework">
                <div className="space-y-4">
                  {strategy.mathematicalFramework.map((f) => <MathBlock key={f._id} latex={f.latex} label={f.label} note={f.note} />)}
                </div>
              </Accordion>
            )}
          </div>
        )}

        {tab === 1 && (
          <div className="space-y-3">
            {backtests?.slice(0, 5).map((bt) => (
              <Link to={`/backtests/${bt._id}`} key={bt._id} className="glass-panel rounded-xl px-5 py-3 flex items-center justify-between hover:border-cyan/30 transition-colors">
                <div className="text-sm"><span className="font-medium">{bt.symbol}</span> · {bt.timeframe} · {bt.marketPhase || "Unspecified"}</div>
                <div className="flex gap-4 text-xs font-mono">
                  <span className="text-signal-profit">{bt.metrics?.winRate ?? "—"}% WR</span>
                  <span className="text-cyan">{bt.metrics?.profitFactor ?? "—"} PF</span>
                  <span className="text-signal-loss">{bt.metrics?.maxDrawdown ?? "—"}% DD</span>
                </div>
              </Link>
            ))}
            {!backtests?.length && <EmptyState title="No backtests yet" description="Log a backtest from the Backtests page, or drop a TradingView screenshot in a backtest's Smart Import panel." />}
          </div>
        )}

        {tab === 2 && (
          <div className="space-y-3">
            <Link to="/code-repository" className="glass-panel rounded-xl px-5 py-3 flex items-center justify-between hover:border-cyan/30 transition-colors">
              <span className="text-sm">Open full Code Repository</span>
              <ChevronRight size={16} className="text-ink-secondary" />
            </Link>
          </div>
        )}

        {tab === 3 && <PineAnalysisPanel strategy={strategy} />}
        {tab === 4 && <AiAnalystPanel strategy={strategy} />}
        {tab === 5 && <TasksPanel strategyId={id} />}
        {tab === 6 && <TimelinePanel strategyId={id} />}
        {tab === 7 && <SimilarStrategiesPanel strategyId={id} />}
        {tab === 8 && (
          <MediaGallery relatedStrategy={id} categories={["Strategy Diagram", "Market Structure Diagram", "Flowchart", "Signal Example", "Entry Example", "Exit Example", "Annotated Chart", "Research Note Image", "Other"]} />
        )}
      </div>
    </div>
  );
}

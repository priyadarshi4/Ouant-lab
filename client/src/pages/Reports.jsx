import { useState } from "react";
import { Plus, Download, Trash2, X, Sparkles } from "lucide-react";
import {
  useReports, useCreateReport, useDeleteReport,
  downloadReportPdf, downloadReportDocx, downloadReportHtml, useAutoGenerateReport,
} from "../features/reports/api.js";
import { useStrategies } from "../features/strategies/api.js";
import GlassCard from "../components/ui/GlassCard.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";

const SECTIONS = [
  ["executiveSummary", "Executive Summary"],
  ["strategyOverview", "Strategy Overview"],
  ["riskAnalysis", "Risk Analysis"],
  ["performanceAnalysis", "Performance Analysis"],
  ["backtestResults", "Backtest Results"],
  ["strengths", "Strengths"],
  ["weaknesses", "Weaknesses"],
  ["recommendations", "Recommendations"],
  ["researchNotes", "Research Notes"],
  ["appendix", "Appendix"],
];

const inputClass = "w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 focus:border-cyan/40 outline-none text-sm";

function NewReportForm({ onClose, strategies }) {
  const [title, setTitle] = useState("");
  const [strategy, setStrategy] = useState("");
  const [sections, setSections] = useState({});
  const [aiNote, setAiNote] = useState(null);
  const createMutation = useCreateReport();
  const autoGenerateMutation = useAutoGenerateReport();

  const handleAutoGenerate = async () => {
    if (!strategy) return;
    const res = await autoGenerateMutation.mutateAsync(strategy);
    setSections(res.sections);
    setAiNote(res.aiAssisted ? "Drafted with Claude from your stored research data." : "Auto-filled from your stored research data (set ANTHROPIC_API_KEY on the server for AI-polished prose).");
    if (!title) {
      const s = strategies?.find((x) => x._id === strategy);
      if (s) setTitle(`${s.name} — Research Report`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createMutation.mutateAsync({ title, strategy, sections, format: "PDF" });
    onClose();
  };

  return (
    <GlassCard glow className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-display font-semibold text-cyan">Generate Report</h2>
        <button onClick={onClose}><X size={18} className="text-ink-secondary" /></button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid md:grid-cols-2 gap-3">
          <input required placeholder="Report title" className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
          <select required className={inputClass} value={strategy} onChange={(e) => setStrategy(e.target.value)}>
            <option value="">Select strategy...</option>
            {strategies?.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </div>

        <button
          type="button"
          onClick={handleAutoGenerate}
          disabled={!strategy || autoGenerateMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-md border border-cyan/30 text-cyan text-sm hover:bg-cyan/10 transition-colors disabled:opacity-50"
        >
          <Sparkles size={14} /> {autoGenerateMutation.isPending ? "Drafting from research data..." : "Auto-Generate from Strategy Data"}
        </button>
        {aiNote && <p className="text-xs text-ink-secondary">{aiNote}</p>}

        {SECTIONS.map(([key, label]) => (
          <div key={key}>
            <label className="block text-xs uppercase tracking-wide text-ink-secondary mb-1">{label}</label>
            <textarea
              className={`${inputClass} min-h-[70px]`}
              value={sections[key] || ""}
              onChange={(e) => setSections({ ...sections, [key]: e.target.value })}
            />
          </div>
        ))}
        <div className="flex justify-end">
          <button type="submit" className="px-5 py-2 rounded-md bg-cyan text-void font-display font-semibold text-sm hover:shadow-glow transition-shadow">
            Save Report
          </button>
        </div>
      </form>
    </GlassCard>
  );
}

export default function Reports() {
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading } = useReports();
  const { data: strategiesData } = useStrategies();
  const deleteMutation = useDeleteReport();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Reports</h1>
          <p className="text-ink-secondary text-sm mt-1">Institutional-grade research reports — auto-drafted, then exported as PDF, DOCX, or HTML.</p>
        </div>
        <button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-2 px-4 py-2 rounded-md bg-cyan text-void font-display font-semibold text-sm hover:shadow-glow transition-shadow">
          <Plus size={16} /> New Report
        </button>
      </div>

      {showForm && <NewReportForm onClose={() => setShowForm(false)} strategies={strategiesData?.strategies} />}

      {isLoading ? (
        <Spinner />
      ) : !data?.reports?.length ? (
        <EmptyState title="No reports generated yet" />
      ) : (
        <div className="space-y-3">
          {data.reports.map((r) => (
            <GlassCard key={r._id} className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="font-medium">{r.title}</h3>
                <div className="text-xs text-ink-secondary">{r.strategy?.name} · {new Date(r.createdAt).toLocaleDateString()}</div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => downloadReportPdf(r._id, r.title)} className="flex items-center gap-1.5 text-cyan text-sm hover:underline">
                  <Download size={14} /> PDF
                </button>
                <button onClick={() => downloadReportDocx(r._id, r.title)} className="flex items-center gap-1.5 text-signal-blue text-sm hover:underline">
                  <Download size={14} /> DOCX
                </button>
                <button onClick={() => downloadReportHtml(r._id, r.title)} className="flex items-center gap-1.5 text-signal-profit text-sm hover:underline">
                  <Download size={14} /> HTML
                </button>
                <button onClick={() => deleteMutation.mutate(r._id)}><Trash2 size={14} className="text-ink-faint hover:text-signal-loss" /></button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

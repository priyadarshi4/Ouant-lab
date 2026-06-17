import { useState } from "react";
import { Plus, Download, Trash2, X } from "lucide-react";
import { useReports, useCreateReport, useDeleteReport, downloadReportPdf } from "../features/reports/api.js";
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
  const createMutation = useCreateReport();

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
          <p className="text-ink-secondary text-sm mt-1">Institutional-grade research reports, exportable as PDF.</p>
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
            <GlassCard key={r._id} className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{r.title}</h3>
                <div className="text-xs text-ink-secondary">{r.strategy?.name} · {new Date(r.createdAt).toLocaleDateString()}</div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => downloadReportPdf(r._id, r.title)} className="flex items-center gap-1.5 text-cyan text-sm hover:underline">
                  <Download size={14} /> PDF
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

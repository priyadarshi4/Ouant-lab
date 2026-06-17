import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useResearchNotes, useCreateResearchNote, useDeleteResearchNote } from "../features/research/api.js";
import { useStrategies } from "../features/strategies/api.js";
import GlassCard from "../components/ui/GlassCard.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";

const TYPES = ["Daily Note", "Observation", "Experiment", "Failure", "Improvement", "Idea", "Lesson Learned"];
const inputClass = "w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 focus:border-cyan/40 outline-none text-sm";

function NewNoteForm({ onClose, strategies }) {
  const [form, setForm] = useState({ title: "", content: "", type: "Daily Note", strategy: "" });
  const createMutation = useCreateResearchNote();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createMutation.mutateAsync({ ...form, strategy: form.strategy || undefined });
    onClose();
  };

  return (
    <GlassCard glow className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-display font-semibold text-cyan">New Research Note</h2>
        <button onClick={onClose}><X size={18} className="text-ink-secondary" /></button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid md:grid-cols-2 gap-3">
          <input required placeholder="Title" className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <select className={inputClass} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <select className={inputClass} value={form.strategy} onChange={(e) => setForm({ ...form, strategy: e.target.value })}>
          <option value="">General (not strategy-specific)</option>
          {strategies?.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
        <textarea required placeholder="What did you observe, try, or learn?" className={`${inputClass} min-h-[120px]`} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
        <div className="flex justify-end">
          <button type="submit" className="px-5 py-2 rounded-md bg-cyan text-void font-display font-semibold text-sm hover:shadow-glow transition-shadow">
            Save Note
          </button>
        </div>
      </form>
    </GlassCard>
  );
}

export default function ResearchJournal() {
  const [showForm, setShowForm] = useState(false);
  const [typeFilter, setTypeFilter] = useState("");
  const { data, isLoading } = useResearchNotes({ type: typeFilter });
  const { data: strategiesData } = useStrategies();
  const deleteMutation = useDeleteResearchNote();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Research Journal</h1>
          <p className="text-ink-secondary text-sm mt-1">Daily notes, experiments, failures, and lessons learned.</p>
        </div>
        <button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-2 px-4 py-2 rounded-md bg-cyan text-void font-display font-semibold text-sm hover:shadow-glow transition-shadow">
          <Plus size={16} /> New Note
        </button>
      </div>

      {showForm && <NewNoteForm onClose={() => setShowForm(false)} strategies={strategiesData?.strategies} />}

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setTypeFilter("")} className={`text-xs px-3 py-1.5 rounded-full border ${typeFilter === "" ? "border-cyan text-cyan" : "border-white/10 text-ink-secondary"}`}>
          All
        </button>
        {TYPES.map((t) => (
          <button key={t} onClick={() => setTypeFilter(t)} className={`text-xs px-3 py-1.5 rounded-full border ${typeFilter === t ? "border-cyan text-cyan" : "border-white/10 text-ink-secondary"}`}>
            {t}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Spinner />
      ) : !data?.notes?.length ? (
        <EmptyState title="No research notes yet" description="Capture observations, failed experiments, and lessons as you iterate." />
      ) : (
        <div className="space-y-3">
          {data.notes.map((note) => (
            <GlassCard key={note._id}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium">{note.title}</h3>
                  <div className="text-xs text-ink-secondary mt-0.5">
                    {note.type} · {note.strategy?.name || "General"} · {new Date(note.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <button onClick={() => deleteMutation.mutate(note._id)} className="text-ink-faint hover:text-signal-loss text-xs">
                  Delete
                </button>
              </div>
              <p className="text-sm text-ink-secondary whitespace-pre-wrap">{note.content}</p>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

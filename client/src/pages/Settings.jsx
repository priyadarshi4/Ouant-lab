import { useState } from "react";
import { useSelector } from "react-redux";
import { Plus, Trash2 } from "lucide-react";
import { useIndicators, useCreateIndicator, useDeleteIndicator } from "../features/indicators/api.js";
import GlassCard from "../components/ui/GlassCard.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";

const inputClass = "w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 focus:border-cyan/40 outline-none text-sm";

function NewIndicatorForm() {
  const [form, setForm] = useState({ name: "", purpose: "", formula: "", parameters: "", interpretation: "" });
  const createMutation = useCreateIndicator();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createMutation.mutateAsync(form);
    setForm({ name: "", purpose: "", formula: "", parameters: "", interpretation: "" });
  };

  return (
    <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-3">
      <input required placeholder="Name (e.g. RSI(2))" className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input placeholder="Parameters" className={inputClass} value={form.parameters} onChange={(e) => setForm({ ...form, parameters: e.target.value })} />
      <input placeholder="Purpose" className={inputClass} value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
      <input placeholder="Formula" className={inputClass} value={form.formula} onChange={(e) => setForm({ ...form, formula: e.target.value })} />
      <textarea placeholder="Interpretation" className={`${inputClass} md:col-span-2 min-h-[70px]`} value={form.interpretation} onChange={(e) => setForm({ ...form, interpretation: e.target.value })} />
      <div className="md:col-span-2 flex justify-end">
        <button type="submit" className="flex items-center gap-2 px-4 py-2 rounded-md bg-cyan text-void font-display font-semibold text-sm hover:shadow-glow transition-shadow">
          <Plus size={16} /> Add Indicator
        </button>
      </div>
    </form>
  );
}

export default function Settings() {
  const user = useSelector((s) => s.auth.user);
  const { data, isLoading } = useIndicators();
  const deleteMutation = useDeleteIndicator();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl font-semibold">Settings</h1>
        <p className="text-ink-secondary text-sm mt-1">Profile and the lab's shared indicator library.</p>
      </div>

      <GlassCard className="space-y-2">
        <h2 className="font-display font-semibold text-cyan mb-2">Profile</h2>
        <div className="text-sm text-ink-secondary">Name: <span className="text-ink-primary">{user?.name}</span></div>
        <div className="text-sm text-ink-secondary">Email: <span className="text-ink-primary">{user?.email}</span></div>
        <div className="text-sm text-ink-secondary">Role: <span className="text-ink-primary capitalize">{user?.role}</span></div>
      </GlassCard>

      <GlassCard className="space-y-4">
        <h2 className="font-display font-semibold text-cyan">Indicator Library</h2>
        <NewIndicatorForm />
        {isLoading ? (
          <Spinner />
        ) : !data?.indicators?.length ? (
          <EmptyState title="No indicators in the library yet" />
        ) : (
          <div className="space-y-2 pt-2">
            {data.indicators.map((ind) => (
              <div key={ind._id} className="flex items-center justify-between border-b border-white/5 pb-2">
                <div>
                  <span className="font-mono text-cyan text-sm">{ind.name}</span>
                  <span className="text-xs text-ink-secondary ml-2">{ind.purpose}</span>
                </div>
                <button onClick={() => deleteMutation.mutate(ind._id)}>
                  <Trash2 size={14} className="text-ink-faint hover:text-signal-loss" />
                </button>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

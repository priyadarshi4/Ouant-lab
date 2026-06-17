import { useState } from "react";
import Editor from "@monaco-editor/react";
import { Plus, Trash2 } from "lucide-react";
import { useCodeVersions, useCreateCodeVersion, useDeleteCodeVersion, useDiffCodeVersions } from "../features/code/api.js";
import { useStrategies } from "../features/strategies/api.js";
import GlassCard from "../components/ui/GlassCard.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";

const inputClass = "w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 focus:border-cyan/40 outline-none text-sm";

const PINE_TEMPLATE = `//@version=6
strategy("New Strategy", overlay=true)

// Entry / exit logic here
`;

export default function CodeRepository() {
  const { data: strategiesData } = useStrategies();
  const [strategy, setStrategy] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ versionLabel: "v1.0", language: "PineScript v6", changeLog: "", code: PINE_TEMPLATE });
  const [diffIds, setDiffIds] = useState({ a: "", b: "" });

  const { data: versionsData, isLoading } = useCodeVersions(strategy);
  const createMutation = useCreateCodeVersion();
  const deleteMutation = useDeleteCodeVersion();
  const { data: diffData } = useDiffCodeVersions(diffIds.a, diffIds.b);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createMutation.mutateAsync({ ...form, strategy });
    setShowForm(false);
    setForm({ ...form, versionLabel: "", changeLog: "" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Code Repository</h1>
        <p className="text-ink-secondary text-sm mt-1">Pine Script versions, change logs, and diff comparisons.</p>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <select className={inputClass + " max-w-xs"} value={strategy} onChange={(e) => setStrategy(e.target.value)}>
          <option value="">Select a strategy...</option>
          {strategiesData?.strategies?.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
        {strategy && (
          <button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-2 px-4 py-2 rounded-md bg-cyan text-void font-display font-semibold text-sm hover:shadow-glow transition-shadow">
            <Plus size={16} /> New Version
          </button>
        )}
      </div>

      {!strategy ? (
        <EmptyState title="Select a strategy" description="Choose a strategy above to view or add its Pine Script versions." />
      ) : (
        <>
          {showForm && (
            <GlassCard glow className="space-y-3">
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid md:grid-cols-3 gap-3">
                  <input required placeholder="Version label (e.g. v1.2)" className={inputClass} value={form.versionLabel} onChange={(e) => setForm({ ...form, versionLabel: e.target.value })} />
                  <select className={inputClass} value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>
                    <option value="PineScript v6">PineScript v6</option>
                    <option value="PineScript v5">PineScript v5</option>
                  </select>
                  <input placeholder="Change log" className={inputClass} value={form.changeLog} onChange={(e) => setForm({ ...form, changeLog: e.target.value })} />
                </div>
                <div className="rounded-md overflow-hidden border border-white/10">
                  <Editor
                    height="320px"
                    defaultLanguage="javascript"
                    theme="vs-dark"
                    value={form.code}
                    onChange={(v) => setForm({ ...form, code: v || "" })}
                    options={{ fontSize: 13, minimap: { enabled: false } }}
                  />
                </div>
                <div className="flex justify-end">
                  <button type="submit" className="px-5 py-2 rounded-md bg-cyan text-void font-display font-semibold text-sm hover:shadow-glow transition-shadow">
                    Save Version
                  </button>
                </div>
              </form>
            </GlassCard>
          )}

          {isLoading ? (
            <Spinner />
          ) : !versionsData?.versions?.length ? (
            <EmptyState title="No code versions yet" description="Add the first Pine Script version for this strategy." />
          ) : (
            <div className="grid lg:grid-cols-3 gap-4">
              <div className="space-y-2 lg:col-span-1">
                {versionsData.versions.map((v) => (
                  <GlassCard key={v._id} className="flex items-center justify-between">
                    <div>
                      <div className="font-mono text-sm text-cyan">{v.versionLabel}</div>
                      <div className="text-xs text-ink-secondary">{v.language} · {new Date(v.createdAt).toLocaleDateString()}</div>
                      {v.changeLog && <div className="text-xs text-ink-secondary mt-1">{v.changeLog}</div>}
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <div className="flex gap-1">
                        <button onClick={() => setDiffIds((d) => ({ ...d, a: v._id }))} className="text-[10px] px-2 py-0.5 rounded border border-white/10 text-ink-secondary hover:border-cyan/40">A</button>
                        <button onClick={() => setDiffIds((d) => ({ ...d, b: v._id }))} className="text-[10px] px-2 py-0.5 rounded border border-white/10 text-ink-secondary hover:border-cyan/40">B</button>
                      </div>
                      <button onClick={() => deleteMutation.mutate(v._id)}><Trash2 size={14} className="text-ink-faint hover:text-signal-loss" /></button>
                    </div>
                  </GlassCard>
                ))}
              </div>

              <div className="lg:col-span-2">
                {diffIds.a && diffIds.b && diffData ? (
                  <GlassCard>
                    <h3 className="font-display font-semibold mb-3 text-cyan">
                      Diff: {diffData.a.label} → {diffData.b.label}
                    </h3>
                    <div className="grid md:grid-cols-2 gap-3 font-mono text-xs">
                      <div className="bg-black/30 rounded-md p-3 overflow-x-auto max-h-[400px]">
                        {diffData.a.lines.map((line, i) => (
                          <div key={i} className={diffData.b.lines[i] !== line ? "bg-signal-loss/15" : ""}>{line || " "}</div>
                        ))}
                      </div>
                      <div className="bg-black/30 rounded-md p-3 overflow-x-auto max-h-[400px]">
                        {diffData.b.lines.map((line, i) => (
                          <div key={i} className={diffData.a.lines[i] !== line ? "bg-signal-profit/15" : ""}>{line || " "}</div>
                        ))}
                      </div>
                    </div>
                  </GlassCard>
                ) : (
                  <EmptyState title="Pick versions A and B" description="Select two versions on the left to compare their code line by line." />
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

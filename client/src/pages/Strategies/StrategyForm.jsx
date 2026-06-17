import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Trash2, Upload } from "lucide-react";
import { useStrategy, useCreateStrategy, useUpdateStrategy } from "../../features/strategies/api.js";
import { useUploadAttachment } from "../../features/attachments/api.js";
import GlassCard from "../../components/ui/GlassCard.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import MathBlock from "../../components/math/MathBlock.jsx";
import { FORMULA_TEMPLATES } from "../../components/math/formulaTemplates.js";

const TYPES = ["Trend Following", "Mean Reversion", "Breakout", "Momentum", "Volatility", "Arbitrage", "Hybrid"];
const STATUSES = ["Draft", "Testing", "Live", "Archived"];
const TRAILING_TYPES = ["None", "ATR Based", "Percentage Based", "Structure Based", "Chandelier Exit", "Custom Formula"];

const emptyForm = {
  name: "",
  strategyType: "Mean Reversion",
  version: "v1.0",
  status: "Draft",
  tags: "",
  description: "",
  coverImageUrl: "",
  executiveSummary: "",
  failureConditions: "",
  marketRegimes: "",
  conclusion: "",
  mathematicalFramework: [],
  changeLog: "",
  documentation: {
    coreIdea: "", philosophy: "", hypothesis: "", marketLogic: "", marketInefficiencyExploited: "",
    edgeExplanation: "", whyItShouldWork: "", whenItWorks: "", whenItFails: "", marketConditions: "",
    behaviorDuringCrashes: "", behaviorDuringBullMarkets: "", behaviorDuringSidewaysMarkets: "",
    riskAssumptions: "", expectedOutcomes: "",
  },
  entryConditions: {
    longEntryRules: "", shortEntryRules: "", indicatorConditions: "", priceActionConditions: "",
    volumeConditions: "", volatilityConditions: "", filters: "", confirmationRules: "",
  },
  exitConditions: {
    longExitRules: "", shortExitRules: "", takeProfitLogic: "", stopLossLogic: "",
    timeBasedExit: "", volatilityExit: "", emergencyExit: "",
  },
  riskManagement: {
    riskPerTrade: "", positionSizingFormula: "", maxDrawdownAllowed: "", maxExposure: "",
    leverageRules: "", portfolioAllocationRules: "", dailyLossLimit: "", weeklyLossLimit: "",
    monthlyLossLimit: "", riskOfRuin: "",
  },
  trailingStop: { logicType: "None", customFormula: "", notes: "" },
};

function Section({ title, children }) {
  return (
    <GlassCard className="space-y-4">
      <h2 className="font-display font-semibold text-cyan">{title}</h2>
      <div className="grid md:grid-cols-2 gap-4">{children}</div>
    </GlassCard>
  );
}

function Field({ label, full, children }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <label className="block text-xs uppercase tracking-wide text-ink-secondary mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputClass = "w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 focus:border-cyan/40 outline-none text-sm";
const textareaClass = `${inputClass} min-h-[90px] resize-y`;

export default function StrategyForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { data, isLoading } = useStrategy(id);
  const createMutation = useCreateStrategy();
  const updateMutation = useUpdateStrategy();

  const [form, setForm] = useState(emptyForm);
  const [hydrated, setHydrated] = useState(!isEdit);
  const uploadMutation = useUploadAttachment();

  if (isEdit && data?.strategy && !hydrated) {
    const s = data.strategy;
    setForm({
      ...emptyForm,
      ...s,
      tags: (s.tags || []).join(", "),
      mathematicalFramework: s.mathematicalFramework || [],
      changeLog: "",
      documentation: { ...emptyForm.documentation, ...s.documentation },
      entryConditions: { ...emptyForm.entryConditions, ...s.entryConditions },
      exitConditions: { ...emptyForm.exitConditions, ...s.exitConditions },
      riskManagement: { ...emptyForm.riskManagement, ...s.riskManagement },
      trailingStop: { ...emptyForm.trailingStop, ...s.trailingStop },
    });
    setHydrated(true);
  }

  if (isEdit && isLoading) return <Spinner label="Loading strategy..." />;

  const updateTop = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const updateNested = (group, key, value) =>
    setForm((f) => ({ ...f, [group]: { ...f[group], [key]: value } }));

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { attachment } = await uploadMutation.mutateAsync({ file, category: "Strategy Diagram" });
    updateTop("coverImageUrl", attachment.url);
  };

  const addFormula = (template) => {
    setForm((f) => ({
      ...f,
      mathematicalFramework: [...f.mathematicalFramework, { label: template?.label || "New Formula", latex: template?.latex || "", note: "" }],
    }));
  };
  const updateFormula = (index, key, value) => {
    setForm((f) => {
      const next = [...f.mathematicalFramework];
      next[index] = { ...next[index], [key]: value };
      return { ...f, mathematicalFramework: next };
    });
  };
  const removeFormula = (index) => {
    setForm((f) => ({ ...f, mathematicalFramework: f.mathematicalFramework.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean) };
    if (isEdit) {
      await updateMutation.mutateAsync({ id, ...payload });
      navigate(`/strategies/${id}`);
    } else {
      const res = await createMutation.mutateAsync(payload);
      navigate(`/strategies/${res.strategy._id}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl font-semibold">{isEdit ? "Edit Strategy" : "New Strategy"}</h1>
        <p className="text-ink-secondary text-sm mt-1">
          Document the full hypothesis-to-risk picture — this becomes the strategy's institutional record.
        </p>
      </div>

      <Section title="Basic Information">
        <Field label="Strategy Name">
          <input required className={inputClass} value={form.name} onChange={(e) => updateTop("name", e.target.value)} />
        </Field>
        <Field label="Strategy Type">
          <select className={inputClass} value={form.strategyType} onChange={(e) => updateTop("strategyType", e.target.value)}>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Version">
          <input className={inputClass} value={form.version} onChange={(e) => updateTop("version", e.target.value)} />
        </Field>
        <Field label="Status">
          <select className={inputClass} value={form.status} onChange={(e) => updateTop("status", e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Tags (comma separated)" full>
          <input className={inputClass} value={form.tags} onChange={(e) => updateTop("tags", e.target.value)} placeholder="rsi, divergence, nifty50" />
        </Field>
        <Field label="Cover Image" full>
          <div className="flex items-center gap-3">
            {form.coverImageUrl && <img src={form.coverImageUrl} alt="cover" className="w-16 h-16 object-cover rounded-md border border-white/10" />}
            <label className="flex items-center gap-2 px-3 py-2 rounded-md border border-cyan/30 text-cyan text-sm cursor-pointer hover:bg-cyan/10 transition-colors">
              <Upload size={14} /> {uploadMutation.isPending ? "Uploading..." : "Upload Cover Image"}
              <input type="file" accept=".png,.jpg,.jpeg,.webp" onChange={handleCoverUpload} className="hidden" />
            </label>
          </div>
        </Field>
        <Field label="Description" full>
          <textarea className={textareaClass} value={form.description} onChange={(e) => updateTop("description", e.target.value)} />
        </Field>
      </Section>

      <Section title="Research Paper Sections">
        <Field label="Executive Summary" full>
          <textarea className={textareaClass} value={form.executiveSummary} onChange={(e) => updateTop("executiveSummary", e.target.value)} />
        </Field>
        <Field label="Failure Conditions">
          <textarea className={textareaClass} value={form.failureConditions} onChange={(e) => updateTop("failureConditions", e.target.value)} />
        </Field>
        <Field label="Market Regimes">
          <textarea className={textareaClass} value={form.marketRegimes} onChange={(e) => updateTop("marketRegimes", e.target.value)} />
        </Field>
        <Field label="Conclusion" full>
          <textarea className={textareaClass} value={form.conclusion} onChange={(e) => updateTop("conclusion", e.target.value)} />
        </Field>
      </Section>

      <GlassCard className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-cyan">Mathematical Framework</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {FORMULA_TEMPLATES.map((t) => (
            <button key={t.label} type="button" onClick={() => addFormula(t)} className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-ink-secondary hover:border-cyan/40 hover:text-cyan transition-colors">
              + {t.label}
            </button>
          ))}
        </div>

        {form.mathematicalFramework.map((f, i) => (
          <div key={i} className="border border-white/10 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <input className={inputClass} placeholder="Label (e.g. Position Sizing)" value={f.label} onChange={(e) => updateFormula(i, "label", e.target.value)} />
              <button type="button" onClick={() => removeFormula(i)}><Trash2 size={16} className="text-ink-faint hover:text-signal-loss" /></button>
            </div>
            <input className={`${inputClass} font-mono`} placeholder="LaTeX, e.g. Risk = AccountSize \times RiskPercent" value={f.latex} onChange={(e) => updateFormula(i, "latex", e.target.value)} />
            <input className={inputClass} placeholder="Note (optional)" value={f.note} onChange={(e) => updateFormula(i, "note", e.target.value)} />
            <MathBlock latex={f.latex} />
          </div>
        ))}

        <button type="button" onClick={() => addFormula()} className="flex items-center gap-2 text-cyan text-sm hover:underline">
          <Plus size={14} /> Add custom formula
        </button>
      </GlassCard>

      <Section title="Core Strategy Documentation">
        {Object.entries(form.documentation).map(([key, value]) => (
          <Field key={key} label={key.replace(/([A-Z])/g, " $1")} full={["coreIdea", "hypothesis", "edgeExplanation"].includes(key)}>
            <textarea className={textareaClass} value={value} onChange={(e) => updateNested("documentation", key, e.target.value)} />
          </Field>
        ))}
      </Section>

      <Section title="Entry Conditions">
        {Object.entries(form.entryConditions).map(([key, value]) => (
          <Field key={key} label={key.replace(/([A-Z])/g, " $1")}>
            <textarea className={textareaClass} value={value} onChange={(e) => updateNested("entryConditions", key, e.target.value)} />
          </Field>
        ))}
      </Section>

      <Section title="Exit Conditions">
        {Object.entries(form.exitConditions).map(([key, value]) => (
          <Field key={key} label={key.replace(/([A-Z])/g, " $1")}>
            <textarea className={textareaClass} value={value} onChange={(e) => updateNested("exitConditions", key, e.target.value)} />
          </Field>
        ))}
      </Section>

      <Section title="Risk Management">
        {Object.entries(form.riskManagement).map(([key, value]) => (
          <Field key={key} label={key.replace(/([A-Z])/g, " $1")}>
            <input className={inputClass} value={value} onChange={(e) => updateNested("riskManagement", key, e.target.value)} />
          </Field>
        ))}
      </Section>

      <Section title="Trailing Stop System">
        <Field label="Logic Type">
          <select
            className={inputClass}
            value={form.trailingStop.logicType}
            onChange={(e) => updateNested("trailingStop", "logicType", e.target.value)}
          >
            {TRAILING_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Custom Formula">
          <input className={inputClass} value={form.trailingStop.customFormula} onChange={(e) => updateNested("trailingStop", "customFormula", e.target.value)} />
        </Field>
        <Field label="Notes" full>
          <textarea className={textareaClass} value={form.trailingStop.notes} onChange={(e) => updateNested("trailingStop", "notes", e.target.value)} />
        </Field>
      </Section>

      {isEdit && (
        <GlassCard>
          <label className="block text-xs uppercase tracking-wide text-ink-secondary mb-1.5">
            Change Log (recorded in version history)
          </label>
          <input className={inputClass} value={form.changeLog} onChange={(e) => updateTop("changeLog", e.target.value)} placeholder="e.g. Tightened stop-loss logic after Q1 drawdown review" />
        </GlassCard>
      )}

      <div className="flex justify-end gap-3 pb-10">
        <button type="button" onClick={() => navigate(-1)} className="px-5 py-2.5 rounded-md border border-white/10 text-ink-secondary text-sm">
          Cancel
        </button>
        <button
          type="submit"
          disabled={createMutation.isPending || updateMutation.isPending}
          className="px-5 py-2.5 rounded-md bg-cyan text-void font-display font-semibold text-sm hover:shadow-glow transition-shadow disabled:opacity-60"
        >
          {isEdit ? "Save Changes" : "Create Strategy"}
        </button>
      </div>
    </form>
  );
}

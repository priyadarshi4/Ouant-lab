import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useStrategy, useCreateStrategy, useUpdateStrategy } from "../../features/strategies/api.js";
import GlassCard from "../../components/ui/GlassCard.jsx";
import Spinner from "../../components/ui/Spinner.jsx";

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

  if (isEdit && data?.strategy && !hydrated) {
    const s = data.strategy;
    setForm({
      ...emptyForm,
      ...s,
      tags: (s.tags || []).join(", "),
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
        <Field label="Description" full>
          <textarea className={textareaClass} value={form.description} onChange={(e) => updateTop("description", e.target.value)} />
        </Field>
      </Section>

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

import { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { Plus, Trash2, Upload } from "lucide-react";
import { useIndicators, useCreateIndicator, useDeleteIndicator } from "../features/indicators/api.js";
import { useUpdateProfile, useUpdateAvatar, useUpdateBanner } from "../features/users/api.js";
import GlassCard from "../components/ui/GlassCard.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";

const inputClass = "w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 focus:border-cyan/40 outline-none text-sm";
const EXPERIENCE_LEVELS = ["Beginner", "Intermediate", "Advanced", "Professional"];

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

function ProfileForm({ user }) {
  const [form, setForm] = useState({
    bio: "", education: "", skills: "", github: "", linkedin: "", portfolio: "",
    researchInterests: "", favoriteMarkets: "", tradingStyle: "", experienceLevel: "Intermediate",
  });
  const updateMutation = useUpdateProfile();
  const avatarMutation = useUpdateAvatar();
  const bannerMutation = useUpdateBanner();
  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setForm({
        bio: user.bio || "",
        education: user.education || "",
        skills: (user.skills || []).join(", "),
        github: user.github || "",
        linkedin: user.linkedin || "",
        portfolio: user.portfolio || "",
        researchInterests: (user.researchInterests || []).join(", "),
        favoriteMarkets: (user.favoriteMarkets || []).join(", "),
        tradingStyle: user.tradingStyle || "",
        experienceLevel: user.experienceLevel || "Intermediate",
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateMutation.mutateAsync({
      ...form,
      skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
      researchInterests: form.researchInterests.split(",").map((s) => s.trim()).filter(Boolean),
      favoriteMarkets: form.favoriteMarkets.split(",").map((s) => s.trim()).filter(Boolean),
    });
  };

  return (
    <GlassCard className="space-y-5">
      <div
        className="h-32 rounded-lg bg-white/5 border border-white/10 relative overflow-hidden"
        style={user?.bannerUrl ? { backgroundImage: `url(${user.bannerUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
      >
        <button
          onClick={() => bannerInputRef.current?.click()}
          className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-black/60 text-xs text-ink-primary hover:bg-black/80"
        >
          <Upload size={12} /> {bannerMutation.isPending ? "Uploading..." : "Banner"}
        </button>
        <input ref={bannerInputRef} type="file" accept=".png,.jpg,.jpeg,.webp" className="hidden" onChange={(e) => e.target.files?.[0] && bannerMutation.mutate(e.target.files[0])} />

        <div className="absolute -bottom-8 left-4 w-20 h-20 rounded-full border-4 border-panel bg-white/10 overflow-hidden flex items-center justify-center">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="font-display text-2xl text-cyan">{user?.name?.[0] || "?"}</span>
          )}
        </div>
        <button
          onClick={() => avatarInputRef.current?.click()}
          className="absolute -bottom-8 left-4 w-20 h-20 rounded-full bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center text-transparent hover:text-white text-xs"
        >
          {avatarMutation.isPending ? "..." : "Edit"}
        </button>
        <input ref={avatarInputRef} type="file" accept=".png,.jpg,.jpeg,.webp" className="hidden" onChange={(e) => e.target.files?.[0] && avatarMutation.mutate(e.target.files[0])} />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 pt-6">
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-ink-secondary mb-1">Education</label>
            <input className={inputClass} value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value })} placeholder="e.g. B.Tech Mechanical Engineering, IIT Patna" />
          </div>
          <div>
            <label className="block text-xs text-ink-secondary mb-1">Trading Style</label>
            <input className={inputClass} value={form.tradingStyle} onChange={(e) => setForm({ ...form, tradingStyle: e.target.value })} placeholder="e.g. Systematic mean reversion, short-term" />
          </div>
        </div>
        <div>
          <label className="block text-xs text-ink-secondary mb-1">Research Bio</label>
          <textarea className={`${inputClass} min-h-[80px]`} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-ink-secondary mb-1">Skills (comma separated)</label>
            <input className={inputClass} value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="Python, Pine Script, ML" />
          </div>
          <div>
            <label className="block text-xs text-ink-secondary mb-1">Research Interests</label>
            <input className={inputClass} value={form.researchInterests} onChange={(e) => setForm({ ...form, researchInterests: e.target.value })} placeholder="Mean reversion, market microstructure" />
          </div>
          <div>
            <label className="block text-xs text-ink-secondary mb-1">Favorite Markets</label>
            <input className={inputClass} value={form.favoriteMarkets} onChange={(e) => setForm({ ...form, favoriteMarkets: e.target.value })} placeholder="Nifty50, Bank Nifty, BTC" />
          </div>
        </div>
        <div className="grid md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-ink-secondary mb-1">GitHub</label>
            <input className={inputClass} value={form.github} onChange={(e) => setForm({ ...form, github: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-ink-secondary mb-1">LinkedIn</label>
            <input className={inputClass} value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-ink-secondary mb-1">Portfolio</label>
            <input className={inputClass} value={form.portfolio} onChange={(e) => setForm({ ...form, portfolio: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-ink-secondary mb-1">Experience Level</label>
            <select className={inputClass} value={form.experienceLevel} onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })}>
              {EXPERIENCE_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={updateMutation.isPending} className="px-5 py-2 rounded-md bg-cyan text-void font-display font-semibold text-sm hover:shadow-glow transition-shadow">
            {updateMutation.isPending ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </form>
    </GlassCard>
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
        <p className="text-ink-secondary text-sm mt-1">Research profile and the lab's shared indicator library.</p>
      </div>

      <ProfileForm user={user} />

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

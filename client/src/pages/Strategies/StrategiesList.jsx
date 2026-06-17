import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus, Star } from "lucide-react";
import { useStrategies, useToggleFavorite } from "../../features/strategies/api.js";
import GlassCard from "../../components/ui/GlassCard.jsx";
import StatusPill from "../../components/ui/StatusPill.jsx";
import GradeBadge from "../../components/ui/GradeBadge.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";

const TYPES = ["Trend Following", "Mean Reversion", "Breakout", "Momentum", "Volatility", "Arbitrage", "Hybrid"];
const STATUSES = ["Draft", "Testing", "Live", "Archived"];

export default function StrategiesList() {
  const [params] = useSearchParams();
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const search = params.get("search") || "";

  const { data, isLoading } = useStrategies({ type, status, search });
  const toggleFavorite = useToggleFavorite();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Strategies</h1>
          <p className="text-ink-secondary text-sm mt-1">
            {search ? `Showing results for "${search}"` : "Every strategy in the lab, documented end to end."}
          </p>
        </div>
        <Link
          to="/strategies/new"
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-cyan text-void font-display font-semibold text-sm hover:shadow-glow transition-shadow"
        >
          <Plus size={16} /> New Strategy
        </Link>
      </div>

      <div className="flex gap-3 flex-wrap">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm outline-none focus:border-cyan/40"
        >
          <option value="">All types</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm outline-none focus:border-cyan/40"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <Spinner />
      ) : !data?.strategies?.length ? (
        <EmptyState
          title="No strategies found"
          description="Create your first strategy to start building out its hypothesis, entry/exit rules, and risk framework."
          action={
            <Link to="/strategies/new" className="text-cyan text-sm hover:underline">
              + New Strategy
            </Link>
          }
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.strategies.map((s) => (
            <GlassCard key={s._id} className="flex flex-col gap-3 hover:border-cyan/30 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <Link to={`/strategies/${s._id}`} className="font-display font-semibold hover:text-cyan transition-colors">
                    {s.name}
                  </Link>
                  <div className="text-xs text-ink-secondary mt-0.5">{s.strategyType} · {s.version}</div>
                </div>
                <button onClick={() => toggleFavorite.mutate(s._id)}>
                  <Star
                    size={18}
                    className={s.isFavorite ? "fill-signal-warn text-signal-warn" : "text-ink-faint"}
                  />
                </button>
              </div>

              <p className="text-sm text-ink-secondary line-clamp-2">{s.description || "No description yet."}</p>

              <div className="flex items-center gap-2 flex-wrap">
                <StatusPill status={s.status} />
                <GradeBadge grade={s.scorecard?.grade} />
                {s.tags?.slice(0, 2).map((tag) => (
                  <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 text-ink-secondary">
                    #{tag}
                  </span>
                ))}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

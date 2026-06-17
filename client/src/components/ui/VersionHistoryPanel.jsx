import { History, RotateCcw } from "lucide-react";
import { useVersionHistory, useRollbackVersion } from "../../features/versions/api.js";
import Spinner from "./Spinner.jsx";
import EmptyState from "./EmptyState.jsx";

export default function VersionHistoryPanel({ strategyId }) {
  const { data, isLoading } = useVersionHistory(strategyId);
  const rollbackMutation = useRollbackVersion(strategyId);

  const handleRollback = (snapshot) => {
    if (window.confirm(`Roll back to the state saved at ${new Date(snapshot.createdAt).toLocaleString()}? The current state will be snapshotted first so this can be undone.`)) {
      rollbackMutation.mutate(snapshot._id);
    }
  };

  if (isLoading) return <Spinner label="Loading version history..." />;
  if (!data?.snapshots?.length) {
    return <EmptyState title="No version history yet" description="A snapshot is created automatically every time this strategy is edited." />;
  }

  return (
    <div className="relative pl-6 space-y-6">
      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-cyan/20" />
      {data.snapshots.map((snap) => (
        <div key={snap._id} className="relative">
          <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-cyan/20 border-2 border-cyan" />
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm">
                <History size={14} className="text-cyan" />
                <span className="font-mono text-cyan">{snap.versionLabel}</span>
                <span className="text-ink-secondary text-xs">
                  {new Date(snap.createdAt).toLocaleString()} · {snap.changedBy?.name || "Unknown"}
                </span>
              </div>
              {snap.changeLog && <p className="text-sm text-ink-secondary mt-1">{snap.changeLog}</p>}
            </div>
            <button
              onClick={() => handleRollback(snap)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-white/10 text-xs text-ink-secondary hover:border-cyan/40 hover:text-cyan transition-colors shrink-0"
            >
              <RotateCcw size={12} /> Rollback
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

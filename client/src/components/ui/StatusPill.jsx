const STATUS_STYLES = {
  Draft: "bg-white/5 text-ink-secondary border-white/10",
  Testing: "bg-signal-warn/10 text-signal-warn border-signal-warn/30",
  Live: "bg-signal-profit/10 text-signal-profit border-signal-profit/30",
  Archived: "bg-white/5 text-ink-faint border-white/10",
};

export default function StatusPill({ status }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-medium ${STATUS_STYLES[status] || STATUS_STYLES.Draft}`}>
      {status}
    </span>
  );
}

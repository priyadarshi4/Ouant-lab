export default function StatTile({ label, value, suffix = "", accent = "cyan", icon: Icon, trend }) {
  const accentMap = {
    cyan: "text-cyan",
    profit: "text-signal-profit",
    loss: "text-signal-loss",
    warn: "text-signal-warn",
    blue: "text-signal-blue",
  };
  return (
    <div className="glass-panel rounded-xl p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-ink-secondary font-medium">{label}</span>
        {Icon && <Icon size={16} className={accentMap[accent]} />}
      </div>
      <div className={`font-display text-2xl font-semibold ${accentMap[accent]}`}>
        {value}
        <span className="text-sm text-ink-secondary ml-1">{suffix}</span>
      </div>
      {trend && <span className="text-xs text-ink-secondary">{trend}</span>}
    </div>
  );
}

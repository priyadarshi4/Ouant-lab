export default function Spinner({ label = "Loading research data..." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink-secondary">
      <div className="w-8 h-8 border-2 border-cyan/20 border-t-cyan rounded-full animate-spin" />
      <span className="text-sm font-mono">{label}</span>
    </div>
  );
}

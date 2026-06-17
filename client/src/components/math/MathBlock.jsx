import { BlockMath, InlineMath } from "react-katex";

function renderError(error) {
  return <span className="text-signal-loss font-mono text-sm">Invalid LaTeX: {error.message}</span>;
}

export default function MathBlock({ latex, inline = false, label, note }) {
  if (!latex) return null;
  const Component = inline ? InlineMath : BlockMath;
  return (
    <div className="space-y-1">
      {label && <div className="text-xs uppercase tracking-wide text-cyan/80">{label}</div>}
      <div className="bg-black/30 border border-white/10 rounded-md px-4 py-3 overflow-x-auto text-ink-primary">
        <Component math={latex} renderError={renderError} />
      </div>
      {note && <p className="text-xs text-ink-secondary">{note}</p>}
    </div>
  );
}

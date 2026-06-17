const GRADE_STYLES = {
  "A+": "bg-signal-profit/15 text-signal-profit border-signal-profit/40",
  A: "bg-signal-profit/10 text-signal-profit border-signal-profit/30",
  B: "bg-cyan/10 text-cyan border-cyan/30",
  C: "bg-signal-warn/10 text-signal-warn border-signal-warn/30",
  D: "bg-signal-loss/10 text-signal-loss border-signal-loss/30",
  Unrated: "bg-white/5 text-ink-secondary border-white/10",
};

export default function GradeBadge({ grade = "Unrated" }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md border text-xs font-display font-semibold ${GRADE_STYLES[grade] || GRADE_STYLES.Unrated}`}>
      {grade}
    </span>
  );
}

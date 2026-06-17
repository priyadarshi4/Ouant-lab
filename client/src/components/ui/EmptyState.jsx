export default function EmptyState({ title, description, action }) {
  return (
    <div className="glass-panel rounded-xl py-16 px-6 flex flex-col items-center justify-center text-center gap-3">
      <h3 className="font-display text-lg text-ink-primary">{title}</h3>
      {description && <p className="text-sm text-ink-secondary max-w-md">{description}</p>}
      {action}
    </div>
  );
}

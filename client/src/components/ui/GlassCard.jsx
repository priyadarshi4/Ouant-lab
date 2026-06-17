export default function GlassCard({ children, className = "", glow = false }) {
  return (
    <div className={`glass-panel rounded-xl p-5 ${glow ? "shadow-glow" : ""} ${className}`}>
      {children}
    </div>
  );
}

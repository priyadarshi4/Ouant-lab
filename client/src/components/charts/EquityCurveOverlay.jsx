import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

const COLORS = ["#00E5FF", "#2979FF", "#00FF94", "#FFB800", "#FF3864", "#A855F7", "#F472B6", "#34D399", "#FB923C", "#60A5FA"];

// series: [{ name, equityCurve: [{ t, equity }] }]
export default function EquityCurveOverlay({ series = [] }) {
  const usable = series.filter((s) => s.equityCurve?.length);
  if (!usable.length) {
    return <p className="text-sm text-ink-secondary">None of the selected strategies have equity curve data logged yet.</p>;
  }

  // Merge into a single array keyed by index position (normalized comparison, not calendar-aligned)
  const maxLen = Math.max(...usable.map((s) => s.equityCurve.length));
  const merged = Array.from({ length: maxLen }, (_, i) => {
    const row = { i };
    usable.forEach((s) => {
      row[s.name] = s.equityCurve[i]?.equity;
    });
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={340}>
      <LineChart data={merged}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="i" stroke="#7C93B3" tick={{ fontSize: 11 }} label={{ value: "Trade #", position: "insideBottom", offset: -5, fill: "#7C93B3", fontSize: 11 }} />
        <YAxis stroke="#7C93B3" tick={{ fontSize: 11 }} />
        <Tooltip contentStyle={{ background: "#0B0F17", border: "1px solid rgba(0,229,255,0.2)", borderRadius: 8 }} />
        <Legend />
        {usable.map((s, i) => (
          <Line key={s.name} type="monotone" dataKey={s.name} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

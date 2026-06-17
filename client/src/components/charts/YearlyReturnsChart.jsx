import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";

export default function YearlyReturnsChart({ data = [] }) {
  if (!data.length) return <p className="text-sm text-ink-secondary">No yearly return data yet.</p>;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="year" stroke="#7C93B3" tick={{ fontSize: 11 }} />
        <YAxis stroke="#7C93B3" tick={{ fontSize: 11 }} />
        <Tooltip contentStyle={{ background: "#0B0F17", border: "1px solid rgba(0,229,255,0.2)", borderRadius: 8 }} />
        <Bar dataKey="returnPct" radius={[4, 4, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.returnPct >= 0 ? "#00FF94" : "#FF3864"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

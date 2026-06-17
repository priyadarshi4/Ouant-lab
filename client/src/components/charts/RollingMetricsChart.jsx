import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

// data: [{ t, rollingSharpe, rollingProfitFactor, rollingDrawdown }]
export default function RollingMetricsChart({ data = [] }) {
  if (!data.length) return <p className="text-sm text-ink-secondary">No rolling metrics data yet.</p>;
  const formatted = data.map((d) => ({ ...d, date: new Date(d.t).toLocaleDateString() }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={formatted}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="date" stroke="#7C93B3" tick={{ fontSize: 11 }} />
        <YAxis stroke="#7C93B3" tick={{ fontSize: 11 }} />
        <Tooltip contentStyle={{ background: "#0B0F17", border: "1px solid rgba(0,229,255,0.2)", borderRadius: 8 }} />
        <Legend />
        <Line type="monotone" dataKey="rollingSharpe" name="Rolling Sharpe" stroke="#00E5FF" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="rollingProfitFactor" name="Rolling Profit Factor" stroke="#2979FF" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="rollingDrawdown" name="Rolling Drawdown" stroke="#FF3864" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

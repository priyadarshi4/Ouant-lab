import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

export default function EquityCurveChart({ data = [] }) {
  const formatted = data.map((d) => ({
    date: new Date(d.t).toLocaleDateString(),
    Equity: d.equity,
    "Buy & Hold": d.benchmarkEquity,
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={formatted}>
        <defs>
          <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00E5FF" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#00E5FF" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="date" stroke="#7C93B3" tick={{ fontSize: 11 }} />
        <YAxis stroke="#7C93B3" tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{ background: "#0B0F17", border: "1px solid rgba(0,229,255,0.2)", borderRadius: 8 }}
          labelStyle={{ color: "#7C93B3" }}
        />
        <Legend />
        <Area type="monotone" dataKey="Equity" stroke="#00E5FF" fill="url(#equityFill)" strokeWidth={2} />
        <Area type="monotone" dataKey="Buy & Hold" stroke="#7C93B3" fill="transparent" strokeWidth={1.5} strokeDasharray="4 4" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

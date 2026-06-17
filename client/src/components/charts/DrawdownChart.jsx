import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

export default function DrawdownChart({ data = [] }) {
  const formatted = data.map((d) => ({
    date: new Date(d.t).toLocaleDateString(),
    Drawdown: -Math.abs(d.drawdown || 0),
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={formatted}>
        <defs>
          <linearGradient id="ddFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF3864" stopOpacity={0} />
            <stop offset="100%" stopColor="#FF3864" stopOpacity={0.35} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="date" stroke="#7C93B3" tick={{ fontSize: 11 }} />
        <YAxis stroke="#7C93B3" tick={{ fontSize: 11 }} />
        <Tooltip contentStyle={{ background: "#0B0F17", border: "1px solid rgba(255,56,100,0.2)", borderRadius: 8 }} />
        <Area type="monotone" dataKey="Drawdown" stroke="#FF3864" fill="url(#ddFill)" strokeWidth={1.5} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Legend } from "recharts";

const COLORS = ["#00E5FF", "#2979FF", "#00FF94", "#FFB800", "#FF3864", "#A855F7", "#F472B6", "#34D399", "#FB923C", "#60A5FA"];

// rows: [{ name, x: value, y: value }]
export default function ScatterComparison({ rows = [], xLabel, yLabel }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <ScatterChart>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis type="number" dataKey="x" name={xLabel} stroke="#7C93B3" tick={{ fontSize: 11 }} label={{ value: xLabel, position: "insideBottom", offset: -5, fill: "#7C93B3", fontSize: 11 }} />
        <YAxis type="number" dataKey="y" name={yLabel} stroke="#7C93B3" tick={{ fontSize: 11 }} label={{ value: yLabel, angle: -90, position: "insideLeft", fill: "#7C93B3", fontSize: 11 }} />
        <ZAxis range={[120, 120]} />
        <Tooltip
          cursor={{ strokeDasharray: "3 3" }}
          contentStyle={{ background: "#0B0F17", border: "1px solid rgba(0,229,255,0.2)", borderRadius: 8 }}
          formatter={(value, name, props) => [value, name]}
          labelFormatter={() => ""}
        />
        <Legend />
        {rows.map((r, i) => (
          <Scatter key={r.name} name={r.name} data={[r]} fill={COLORS[i % COLORS.length]} />
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  );
}

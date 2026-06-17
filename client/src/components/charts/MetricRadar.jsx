import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip } from "recharts";

const COLORS = ["#00E5FF", "#2979FF", "#00FF94", "#FFB800", "#FF3864"];

// rows: [{ metric: "Win Rate", StrategyA: 62, StrategyB: 48 }, ...]
export default function MetricRadar({ rows = [], seriesKeys = [] }) {
  return (
    <ResponsiveContainer width="100%" height={360}>
      <RadarChart data={rows}>
        <PolarGrid stroke="rgba(255,255,255,0.08)" />
        <PolarAngleAxis dataKey="metric" stroke="#7C93B3" tick={{ fontSize: 11 }} />
        <PolarRadiusAxis stroke="rgba(255,255,255,0.08)" tick={{ fontSize: 10 }} />
        {seriesKeys.map((key, i) => (
          <Radar key={key} name={key} dataKey={key} stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.18} />
        ))}
        <Legend />
        <Tooltip contentStyle={{ background: "#0B0F17", border: "1px solid rgba(0,229,255,0.2)", borderRadius: 8 }} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function cellColor(value) {
  if (value == null) return "rgba(255,255,255,0.03)";
  const alpha = Math.min(Math.abs(value) / 10, 1) * 0.6;
  return value >= 0 ? `rgba(0,255,148,${alpha})` : `rgba(255,56,100,${alpha})`;
}

// data: [{ month: "2024-03", returnPct: 4.2 }, ...]
export default function MonthlyReturnHeatmap({ data = [] }) {
  if (!data.length) return <p className="text-sm text-ink-secondary">No monthly return data yet.</p>;

  const byYear = {};
  data.forEach((d) => {
    const [year, month] = d.month.split("-");
    byYear[year] = byYear[year] || Array(12).fill(null);
    byYear[year][Number(month) - 1] = d.returnPct;
  });
  const years = Object.keys(byYear).sort();

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse text-xs">
        <thead>
          <tr>
            <th className="p-2"></th>
            {MONTH_LABELS.map((m) => <th key={m} className="p-2 text-ink-secondary font-mono">{m}</th>)}
          </tr>
        </thead>
        <tbody>
          {years.map((year) => (
            <tr key={year}>
              <td className="p-2 text-ink-secondary font-mono pr-3">{year}</td>
              {byYear[year].map((val, i) => (
                <td key={i} className="p-0">
                  <div
                    title={val != null ? `${val.toFixed(2)}%` : "No data"}
                    className="w-12 h-9 flex items-center justify-center border border-white/5 font-mono text-[10px] text-ink-primary"
                    style={{ backgroundColor: cellColor(val) }}
                  >
                    {val != null ? val.toFixed(1) : ""}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

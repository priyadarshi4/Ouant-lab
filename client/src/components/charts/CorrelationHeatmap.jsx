function cellColor(value) {
  // -1 (red/loss) -> 0 (neutral panel) -> +1 (cyan)
  if (value >= 0) {
    const alpha = Math.min(Math.abs(value), 1) * 0.55;
    return `rgba(0,229,255,${alpha})`;
  }
  const alpha = Math.min(Math.abs(value), 1) * 0.55;
  return `rgba(255,56,100,${alpha})`;
}

export default function CorrelationHeatmap({ names = [], matrix = [] }) {
  if (!names.length) return null;
  return (
    <div className="overflow-x-auto">
      <table className="border-collapse text-xs">
        <thead>
          <tr>
            <th className="p-2"></th>
            {names.map((n) => (
              <th key={n} className="p-2 text-ink-secondary font-mono whitespace-nowrap">{n}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={names[i]}>
              <td className="p-2 text-ink-secondary font-mono whitespace-nowrap text-right pr-3">{names[i]}</td>
              {row.map((value, j) => (
                <td key={j} className="p-0">
                  <div
                    title={value.toFixed(2)}
                    className="w-14 h-10 flex items-center justify-center border border-white/5 font-mono text-ink-primary"
                    style={{ backgroundColor: cellColor(value) }}
                  >
                    {value.toFixed(2)}
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

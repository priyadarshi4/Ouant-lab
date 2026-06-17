import { useEffect, useRef, useState, useMemo } from "react";
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from "d3-force";
import { useNavigate } from "react-router-dom";

const TYPE_STYLE = {
  strategy: { color: "#00E5FF", radius: 10 },
  indicator: { color: "#2979FF", radius: 6 },
  symbol: { color: "#00FF94", radius: 6 },
  regime: { color: "#FFB800", radius: 6 },
  note: { color: "#A855F7", radius: 4 },
};

const WIDTH = 900;
const HEIGHT = 560;

export default function KnowledgeGraph({ nodes = [], links = [] }) {
  const navigate = useNavigate();
  const [positions, setPositions] = useState(null);
  const [hovered, setHovered] = useState(null);
  const simRef = useRef(null);

  const simNodes = useMemo(() => nodes.map((n) => ({ ...n })), [nodes]);
  const simLinks = useMemo(() => links.map((l) => ({ ...l })), [links]);

  useEffect(() => {
    if (!simNodes.length) return;
    const sim = forceSimulation(simNodes)
      .force("link", forceLink(simLinks).id((d) => d.id).distance(70).strength(0.5))
      .force("charge", forceManyBody().strength(-140))
      .force("center", forceCenter(WIDTH / 2, HEIGHT / 2))
      .force("collide", forceCollide((d) => (TYPE_STYLE[d.type]?.radius || 5) + 14))
      .stop();

    for (let i = 0; i < 220; i++) sim.tick();
    simRef.current = sim;

    setPositions(
      simNodes.map((n) => ({ id: n.id, label: n.label, type: n.type, x: n.x, y: n.y }))
    );
  }, [simNodes, simLinks]);

  if (!nodes.length) {
    return <p className="text-sm text-ink-secondary">Not enough connected research data yet to render a graph.</p>;
  }
  if (!positions) return null;

  const posById = Object.fromEntries(positions.map((p) => [p.id, p]));

  const handleNodeClick = (node) => {
    if (node.type === "strategy") {
      const id = node.id.split(":")[1];
      navigate(`/strategies/${id}`);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-4 flex-wrap text-xs">
        {Object.entries(TYPE_STYLE).map(([type, { color }]) => (
          <div key={type} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: color }} />
            <span className="text-ink-secondary capitalize">{type}</span>
          </div>
        ))}
      </div>

      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-[560px] glass-panel rounded-xl">
        {simLinks.map((l, i) => {
          const a = posById[typeof l.source === "object" ? l.source.id : l.source];
          const b = posById[typeof l.target === "object" ? l.target.id : l.target];
          if (!a || !b) return null;
          return (
            <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(0,229,255,0.15)" strokeWidth={1} />
          );
        })}
        {positions.map((n) => {
          const style = TYPE_STYLE[n.type] || TYPE_STYLE.note;
          const isHovered = hovered === n.id;
          return (
            <g
              key={n.id}
              transform={`translate(${n.x},${n.y})`}
              onMouseEnter={() => setHovered(n.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => handleNodeClick(n)}
              className={n.type === "strategy" ? "cursor-pointer" : "cursor-default"}
            >
              <circle
                r={isHovered ? style.radius + 3 : style.radius}
                fill={style.color}
                opacity={isHovered ? 0.9 : 0.65}
                stroke={style.color}
                strokeWidth={1.5}
              />
              {(isHovered || n.type === "strategy") && (
                <text
                  x={style.radius + 6}
                  y={4}
                  fontSize={11}
                  fontFamily="Inter, sans-serif"
                  fill="#E6F1FF"
                  className="select-none"
                >
                  {n.label.length > 28 ? n.label.slice(0, 28) + "…" : n.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <p className="text-xs text-ink-secondary">Click a cyan strategy node to open its research record.</p>
    </div>
  );
}

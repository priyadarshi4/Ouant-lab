import { useEffect, useRef } from "react";

// The lab's signature visual: the actual derivative-based formulas from
// Munnu's own quant research (velocity/acceleration/jerk of price, Market
// Reynolds Number) drifting faintly behind the interface — turning the
// research itself into the backdrop rather than a generic particle effect.
const FORMULAS = [
  "v = dP/dt",
  "a = dv/dt",
  "j = da/dt",
  "Re = (V \u00b7 dP/dt) / \u03c3",
  "\u2202P/\u2202t",
  "ALMA(n,\u03c3,o)",
  "Z = (x - \u03bc)/\u03c3",
  "\u03c3\u00b2 = \u03a3(x-\u03bc)\u00b2/n",
];

export default function FormulaBackground({ density = 14 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let particles = [];
    let animationId;
    let width, height;

    const resize = () => {
      width = canvas.parentElement.clientWidth;
      height = canvas.parentElement.clientHeight;
      canvas.width = width;
      canvas.height = height;
    };

    const init = () => {
      resize();
      particles = Array.from({ length: density }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        text: FORMULAS[Math.floor(Math.random() * FORMULAS.length)],
        speed: 0.06 + Math.random() * 0.12,
        size: 11 + Math.random() * 6,
        opacity: 0.05 + Math.random() * 0.1,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.font = "12px 'IBM Plex Mono', monospace";
      particles.forEach((p) => {
        ctx.font = `${p.size}px 'IBM Plex Mono', monospace`;
        ctx.fillStyle = `rgba(0,229,255,${p.opacity})`;
        ctx.fillText(p.text, p.x, p.y);
        if (!prefersReducedMotion) {
          p.y -= p.speed;
          if (p.y < -20) {
            p.y = height + 20;
            p.x = Math.random() * width;
          }
        }
      });
      animationId = requestAnimationFrame(draw);
    };

    init();
    draw();
    window.addEventListener("resize", init);
    return () => {
      window.removeEventListener("resize", init);
      cancelAnimationFrame(animationId);
    };
  }, [density]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  );
}

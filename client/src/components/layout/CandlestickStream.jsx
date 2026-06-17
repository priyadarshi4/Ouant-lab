import { useEffect, useRef } from "react";

// Lightweight decorative candlestick stream — synthetic random-walk price
// action drifting across the canvas. Purely ambient (aria-hidden), no real
// market data implied.
export default function CandlestickStream({ height = 64 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width, candles, animationId, lastPrice = 100;

    const resize = () => {
      width = canvas.parentElement.clientWidth;
      canvas.width = width;
      canvas.height = height;
    };

    const makeCandle = (x) => {
      const open = lastPrice;
      const change = (Math.random() - 0.48) * 4;
      const close = Math.max(20, open + change);
      const high = Math.max(open, close) + Math.random() * 2;
      const low = Math.min(open, close) - Math.random() * 2;
      lastPrice = close;
      return { x, open, close, high, low };
    };

    const init = () => {
      resize();
      const count = Math.ceil(width / 14) + 2;
      candles = Array.from({ length: count }, (_, i) => makeCandle(i * 14));
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const minP = Math.min(...candles.map((c) => c.low));
      const maxP = Math.max(...candles.map((c) => c.high));
      const range = maxP - minP || 1;
      const scaleY = (p) => height - ((p - minP) / range) * height;

      candles.forEach((c) => {
        const up = c.close >= c.open;
        ctx.strokeStyle = up ? "rgba(0,255,148,0.35)" : "rgba(255,56,100,0.35)";
        ctx.fillStyle = up ? "rgba(0,255,148,0.18)" : "rgba(255,56,100,0.18)";
        ctx.beginPath();
        ctx.moveTo(c.x + 4, scaleY(c.high));
        ctx.lineTo(c.x + 4, scaleY(c.low));
        ctx.stroke();
        const bodyTop = scaleY(Math.max(c.open, c.close));
        const bodyBottom = scaleY(Math.min(c.open, c.close));
        ctx.fillRect(c.x, bodyTop, 8, Math.max(1, bodyBottom - bodyTop));
      });

      if (!prefersReducedMotion) {
        candles.forEach((c) => (c.x -= 0.4));
        if (candles[0]?.x < -14) {
          candles.shift();
          const lastX = candles[candles.length - 1]?.x || 0;
          candles.push(makeCandle(lastX + 14));
        }
      }
      animationId = requestAnimationFrame(draw);
    };

    init();
    draw();
    window.addEventListener("resize", init);
    return () => {
      window.removeEventListener("resize", init);
      cancelAnimationFrame(animationId);
    };
  }, [height]);

  return <canvas ref={canvasRef} className="w-full block opacity-70" style={{ height }} aria-hidden="true" />;
}

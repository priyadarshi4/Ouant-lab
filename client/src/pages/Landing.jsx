import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Atom, FlaskConical, LineChart, NotebookPen } from "lucide-react";
import FormulaBackground from "../components/layout/FormulaBackground.jsx";

function useCountUp(target, durationMs = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start;
    let raf;
    const tick = (t) => {
      if (!start) start = t;
      const progress = Math.min((t - start) / durationMs, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return value;
}

export default function Landing() {
  const strategies = useCountUp(47);
  const backtests = useCountUp(312);
  const symbols = useCountUp(28);

  return (
    <div className="min-h-screen bg-lab text-ink-primary overflow-hidden">
      <header className="relative z-10 flex items-center justify-between px-6 md:px-10 h-20">
        <div className="flex items-center gap-2">
          <Atom className="text-cyan" size={24} />
          <span className="font-display font-semibold tracking-wide">
            PRIYADARSHI<span className="text-cyan"> QUANT LAB</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm text-ink-secondary hover:text-ink-primary transition-colors">
            Sign in
          </Link>
          <Link
            to="/register"
            className="text-sm px-4 py-2 rounded-md bg-cyan/10 border border-cyan/40 text-cyan hover:bg-cyan/20 transition-colors"
          >
            Get started
          </Link>
        </div>
      </header>

      <section className="relative">
        <div className="absolute inset-0 h-[640px]">
          <FormulaBackground density={20} />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center px-6 pt-20 pb-28">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-mono text-cyan text-sm tracking-widest uppercase mb-4"
          >
            Research. Backtest. Validate. Evolve.
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-4xl md:text-6xl font-semibold leading-tight"
          >
            A hedge-fund-grade lab for
            <span className="text-cyan text-glow"> your trading research</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-ink-secondary text-base md:text-lg max-w-2xl mx-auto"
          >
            Store, backtest, score, and evolve every strategy you build — from mean
            reversion to physics-inspired exhaustion models — in one dark, data-dense
            research terminal.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-10 flex items-center justify-center gap-4"
          >
            <Link
              to="/register"
              className="flex items-center gap-2 px-6 py-3 rounded-md bg-cyan text-void font-display font-semibold shadow-glowStrong hover:shadow-glow transition-shadow"
            >
              Open the lab <ArrowRight size={18} />
            </Link>
          </motion.div>

          <div className="mt-16 grid grid-cols-3 gap-6 max-w-xl mx-auto">
            <div className="glass-panel rounded-lg py-4">
              <div className="font-display text-2xl text-cyan">{strategies}</div>
              <div className="text-xs text-ink-secondary mt-1">Strategies tracked</div>
            </div>
            <div className="glass-panel rounded-lg py-4">
              <div className="font-display text-2xl text-cyan">{backtests}</div>
              <div className="text-xs text-ink-secondary mt-1">Backtests logged</div>
            </div>
            <div className="glass-panel rounded-lg py-4">
              <div className="font-display text-2xl text-cyan">{symbols}</div>
              <div className="text-xs text-ink-secondary mt-1">Symbols tested</div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-24 grid md:grid-cols-3 gap-6">
        {[
          { icon: FlaskConical, title: "Strategy Documentation", text: "Hypothesis, edge, entry/exit logic, and risk rules — all version-controlled per strategy." },
          { icon: LineChart, title: "Backtest Vault", text: "Store every TradingView-style metric, equity curve, Monte Carlo run, and walk-forward report." },
          { icon: NotebookPen, title: "Research Journal", text: "Daily notes, failures, lessons learned — the thinking behind every iteration, preserved." },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="glass-panel rounded-xl p-6">
            <Icon className="text-cyan mb-3" size={22} />
            <h3 className="font-display font-semibold mb-2">{title}</h3>
            <p className="text-sm text-ink-secondary">{text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

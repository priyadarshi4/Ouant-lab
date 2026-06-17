import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Atom } from "lucide-react";
import { register, clearAuthError } from "../features/auth/authSlice.js";
import FormulaBackground from "../components/layout/FormulaBackground.jsx";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error, user } = useSelector((s) => s.auth);

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  useEffect(() => () => dispatch(clearAuthError()), [dispatch]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(register(form));
  };

  return (
    <div className="min-h-screen bg-lab flex items-center justify-center relative px-4">
      <div className="absolute inset-0">
        <FormulaBackground density={10} />
      </div>
      <form
        onSubmit={handleSubmit}
        className="relative z-10 glass-panel rounded-xl p-8 w-full max-w-sm shadow-glow"
      >
        <div className="flex items-center gap-2 mb-6 justify-center">
          <Atom className="text-cyan" size={22} />
          <span className="font-display font-semibold">PRIYADARSHI QUANT LAB</span>
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 rounded-md bg-signal-loss/10 border border-signal-loss/30 text-signal-loss text-sm">
            {error}
          </div>
        )}

        <label className="block text-xs uppercase tracking-wide text-ink-secondary mb-1.5">Name</label>
        <input
          name="name"
          required
          value={form.name}
          onChange={handleChange}
          className="w-full mb-4 px-3 py-2.5 rounded-md bg-white/5 border border-white/10 focus:border-cyan/50 outline-none text-sm"
          placeholder="Munnu Priyadarshi"
        />

        <label className="block text-xs uppercase tracking-wide text-ink-secondary mb-1.5">Email</label>
        <input
          name="email"
          type="email"
          required
          value={form.email}
          onChange={handleChange}
          className="w-full mb-4 px-3 py-2.5 rounded-md bg-white/5 border border-white/10 focus:border-cyan/50 outline-none text-sm"
          placeholder="you@quantlab.com"
        />

        <label className="block text-xs uppercase tracking-wide text-ink-secondary mb-1.5">Password</label>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          value={form.password}
          onChange={handleChange}
          className="w-full mb-6 px-3 py-2.5 rounded-md bg-white/5 border border-white/10 focus:border-cyan/50 outline-none text-sm"
          placeholder="At least 8 characters"
        />

        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full py-2.5 rounded-md bg-cyan text-void font-display font-semibold hover:shadow-glow transition-shadow disabled:opacity-60"
        >
          {status === "loading" ? "Creating account..." : "Create account"}
        </button>

        <p className="mt-5 text-center text-sm text-ink-secondary">
          Already have an account?{" "}
          <Link to="/login" className="text-cyan hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}

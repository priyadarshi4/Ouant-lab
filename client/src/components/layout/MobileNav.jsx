import { NavLink } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import { Atom, X } from "lucide-react";
import { closeMobileNav } from "../../app/uiSlice.js";
import { NAV_ITEMS } from "./navItems.js";

export default function MobileNav() {
  const open = useSelector((s) => s.ui.mobileNavOpen);
  const dispatch = useDispatch();
  const close = () => dispatch(closeMobileNav());

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.22 }}
            className="absolute left-0 top-0 h-full w-72 max-w-[80vw] bg-panel border-r border-cyan/10 flex flex-col"
          >
            <div className="flex items-center justify-between gap-2 px-4 h-16 border-b border-cyan/10">
              <div className="flex items-center gap-2">
                <Atom className="text-cyan" size={22} />
                <span className="font-display font-semibold text-sm text-ink-primary tracking-wide">
                  PRIYADARSHI<span className="text-cyan"> QUANT LAB</span>
                </span>
              </div>
              <button onClick={close} className="text-ink-secondary hover:text-cyan">
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
              {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={close}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-cyan/10 text-cyan border border-cyan/30 shadow-glow"
                        : "text-ink-secondary hover:text-ink-primary hover:bg-white/5"
                    }`
                  }
                >
                  <Icon size={18} className="shrink-0" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

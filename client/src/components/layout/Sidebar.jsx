import { NavLink } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { ChevronsLeft, ChevronsRight, Atom } from "lucide-react";
import { toggleSidebar } from "../../app/uiSlice.js";
import { NAV_ITEMS } from "./navItems.js";

export default function Sidebar() {
  const collapsed = useSelector((s) => s.ui.sidebarCollapsed);
  const dispatch = useDispatch();

  return (
    <aside
      className={`hidden md:flex flex-col border-r border-cyan/10 bg-panel/80 backdrop-blur-md transition-all duration-300 ${
        collapsed ? "w-[68px]" : "w-64"
      }`}
    >
      <div className="flex items-center gap-2 px-4 h-16 border-b border-cyan/10">
        <Atom className="text-cyan shrink-0" size={22} />
        {!collapsed && (
          <span className="font-display font-semibold text-sm text-ink-primary tracking-wide truncate">
            PRIYADARSHI<span className="text-cyan"> QUANT LAB</span>
          </span>
        )}
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-cyan/10 text-cyan border border-cyan/30 shadow-glow"
                  : "text-ink-secondary hover:text-ink-primary hover:bg-white/5"
              }`
            }
          >
            <Icon size={18} className="shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={() => dispatch(toggleSidebar())}
        className="flex items-center justify-center gap-2 h-12 border-t border-cyan/10 text-ink-secondary hover:text-cyan transition-colors"
      >
        {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
      </button>
    </aside>
  );
}

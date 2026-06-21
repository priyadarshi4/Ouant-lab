import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Search, LogOut, User, Menu } from "lucide-react";
import { logout } from "../../features/auth/authSlice.js";
import { toggleMobileNav } from "../../app/uiSlice.js";

export default function Topbar() {
  const [query, setQuery] = useState("");
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/strategies?search=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className="h-16 flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 border-b border-cyan/10 bg-panel/60 backdrop-blur-md">
      <button
        onClick={() => dispatch(toggleMobileNav())}
        className="md:hidden p-2 -ml-1 text-ink-secondary hover:text-cyan shrink-0"
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-md">
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-white/5 border border-white/10 focus-within:border-cyan/40 transition-colors w-full">
          <Search size={16} className="text-ink-secondary shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search strategies, tags, indicators, symbols..."
            className="bg-transparent outline-none text-sm w-full placeholder:text-ink-faint"
          />
        </div>
      </form>

      <button onClick={() => navigate("/strategies")} className="sm:hidden p-2 text-ink-secondary hover:text-cyan">
        <Search size={20} />
      </button>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-md border border-white/10">
          <User size={16} className="text-cyan" />
          <span className="hidden sm:inline text-sm text-ink-primary">{user?.name || "Researcher"}</span>
        </div>
        <button
          onClick={() => dispatch(logout())}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md border border-white/10 text-ink-secondary hover:text-signal-loss hover:border-signal-loss/40 transition-colors text-sm"
        >
          <LogOut size={15} />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}

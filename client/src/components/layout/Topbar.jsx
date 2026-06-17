import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Search, LogOut, User } from "lucide-react";
import { logout } from "../../features/auth/authSlice.js";

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
    <header className="h-16 flex items-center justify-between gap-4 px-6 border-b border-cyan/10 bg-panel/60 backdrop-blur-md">
      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-white/5 border border-white/10 focus-within:border-cyan/40 transition-colors">
          <Search size={16} className="text-ink-secondary" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search strategies, tags, indicators, symbols..."
            className="bg-transparent outline-none text-sm w-full placeholder:text-ink-faint"
          />
        </div>
      </form>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/10">
          <User size={16} className="text-cyan" />
          <span className="text-sm text-ink-primary">{user?.name || "Researcher"}</span>
        </div>
        <button
          onClick={() => dispatch(logout())}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-white/10 text-ink-secondary hover:text-signal-loss hover:border-signal-loss/40 transition-colors text-sm"
        >
          <LogOut size={15} />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}

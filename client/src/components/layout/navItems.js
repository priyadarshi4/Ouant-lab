import {
  LayoutDashboard, FlaskConical, LineChart, NotebookPen, BarChart3,
  Globe2, Code2, FileText, Settings as SettingsIcon, Share2,
} from "lucide-react";

export const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/strategies", label: "Strategies", icon: FlaskConical },
  { to: "/backtests", label: "Backtests", icon: LineChart },
  { to: "/research-journal", label: "Research Journal", icon: NotebookPen },
  { to: "/performance-analytics", label: "Performance Analytics", icon: BarChart3 },
  { to: "/market-universe", label: "Market Universe", icon: Globe2 },
  { to: "/code-repository", label: "Code Repository", icon: Code2 },
  { to: "/knowledge-graph", label: "Knowledge Graph", icon: Share2 },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

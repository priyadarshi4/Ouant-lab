import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useDispatch } from "react-redux";

import { fetchMe } from "./features/auth/authSlice.js";
import ProtectedRoute from "./components/layout/ProtectedRoute.jsx";
import AppLayout from "./components/layout/AppLayout.jsx";

import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";

// Strategy
import StrategiesList from "./pages/Strategies/StrategiesList.jsx";
import StrategyForm from "./pages/Strategies/StrategyForm.jsx";
import StrategyDetail from "./pages/Strategies/StrategyDetail.jsx";
import StrategyWorkspace from "./pages/Workspace/StrategyWorkspace.jsx";

// Backtests
import BacktestsList from "./pages/Backtests/BacktestsList.jsx";
import BacktestDetail from "./pages/Backtests/BacktestDetail.jsx";

// Research & analytics
import ResearchJournal from "./pages/ResearchJournal.jsx";
import PerformanceAnalytics from "./pages/PerformanceAnalytics.jsx";
import MarketUniverse from "./pages/MarketUniverse.jsx";
import CodeRepository from "./pages/CodeRepository.jsx";
import KnowledgeGraphPage from "./pages/KnowledgeGraph.jsx";

// Phase 2
import PortfolioLab from "./pages/Portfolio/PortfolioLab.jsx";

// Phase 3
import PaperTradingOS from "./pages/PaperTrading/PaperTradingOS.jsx";

// AI
import QuantAssistant from "./pages/QuantAssistant.jsx";

// Misc
import Reports from "./pages/Reports.jsx";
import Settings from "./pages/Settings.jsx";
import NotFound from "./pages/NotFound.jsx";

export default function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    if (localStorage.getItem("pql_access_token")) {
      dispatch(fetchMe());
    } else {
      dispatch({ type: "auth/fetchMe/rejected" });
    }
  }, [dispatch]);

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Strategies */}
        <Route path="/strategies" element={<StrategiesList />} />
        <Route path="/strategies/new" element={<StrategyForm />} />
        <Route path="/strategies/:id/edit" element={<StrategyForm />} />
        <Route path="/strategies/:id" element={<StrategyDetail />} />
        <Route path="/workspace/:id" element={<StrategyWorkspace />} />

        {/* Backtests */}
        <Route path="/backtests" element={<BacktestsList />} />
        <Route path="/backtests/:id" element={<BacktestDetail />} />

        {/* Research & analytics */}
        <Route path="/research-journal" element={<ResearchJournal />} />
        <Route path="/performance-analytics" element={<PerformanceAnalytics />} />
        <Route path="/market-universe" element={<MarketUniverse />} />
        <Route path="/code-repository" element={<CodeRepository />} />
        <Route path="/knowledge-graph" element={<KnowledgeGraphPage />} />

        {/* Phase 2 */}
        <Route path="/portfolio-lab" element={<PortfolioLab />} />

        {/* Phase 3 */}
        <Route path="/paper-trading" element={<PaperTradingOS />} />

        {/* AI */}
        <Route path="/assistant" element={<QuantAssistant />} />

        {/* Misc */}
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

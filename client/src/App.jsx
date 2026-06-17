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
import StrategiesList from "./pages/Strategies/StrategiesList.jsx";
import StrategyForm from "./pages/Strategies/StrategyForm.jsx";
import StrategyDetail from "./pages/Strategies/StrategyDetail.jsx";
import BacktestsList from "./pages/Backtests/BacktestsList.jsx";
import BacktestDetail from "./pages/Backtests/BacktestDetail.jsx";
import ResearchJournal from "./pages/ResearchJournal.jsx";
import PerformanceAnalytics from "./pages/PerformanceAnalytics.jsx";
import MarketUniverse from "./pages/MarketUniverse.jsx";
import CodeRepository from "./pages/CodeRepository.jsx";
import KnowledgeGraphPage from "./pages/KnowledgeGraph.jsx";
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
        <Route path="/strategies" element={<StrategiesList />} />
        <Route path="/strategies/new" element={<StrategyForm />} />
        <Route path="/strategies/:id/edit" element={<StrategyForm />} />
        <Route path="/strategies/:id" element={<StrategyDetail />} />
        <Route path="/backtests" element={<BacktestsList />} />
        <Route path="/backtests/:id" element={<BacktestDetail />} />
        <Route path="/research-journal" element={<ResearchJournal />} />
        <Route path="/performance-analytics" element={<PerformanceAnalytics />} />
        <Route path="/market-universe" element={<MarketUniverse />} />
        <Route path="/code-repository" element={<CodeRepository />} />
        <Route path="/knowledge-graph" element={<KnowledgeGraphPage />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import connectDB from "./config/db.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import strategyRoutes from "./routes/strategyRoutes.js";
import backtestRoutes from "./routes/backtestRoutes.js";
import researchNoteRoutes from "./routes/researchNoteRoutes.js";
import codeVersionRoutes from "./routes/codeVersionRoutes.js";
import indicatorRoutes from "./routes/indicatorRoutes.js";
import attachmentRoutes from "./routes/attachmentRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import extractRoutes from "./routes/extractRoutes.js";
import timelineRoutes from "./routes/timelineRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import pineRoutes from "./routes/pineRoutes.js";
import portfolioRoutes from "./routes/portfolioRoutes.js";
import paperTradingRoutes from "./routes/paperTradingRoutes.js";
import optimizationRoutes from "./routes/optimizationRoutes.js";
import assistantRoutes from "./routes/assistantRoutes.js";

dotenv.config();
connectDB();

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "*", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

// Generous limit on the API to support the AI assistant's longer context
// fetches. The webhook endpoint is excluded from rate limiting since it's
// hit by TradingView at alert frequency.
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 1000, skip: (req) => req.path.includes("/webhook/") });
app.use("/api", limiter);

app.get("/api/health", (req, res) => res.json({ status: "ok", service: "Priyadarshi Quant Lab API", version: "3.0" }));

// ── Phase 1: Core Research OS ─────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/strategies", strategyRoutes);
app.use("/api/backtests", backtestRoutes);
app.use("/api/research-notes", researchNoteRoutes);
app.use("/api/code-versions", codeVersionRoutes);
app.use("/api/indicators", indicatorRoutes);
app.use("/api/attachments", attachmentRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/extract", extractRoutes);
app.use("/api/timeline", timelineRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/pine", pineRoutes);

// ── Phase 2: Portfolio Lab ─────────────────────────────────────────────────────
app.use("/api/portfolios", portfolioRoutes);
app.use("/api/optimizations", optimizationRoutes);

// ── Phase 3: Paper Trading OS ─────────────────────────────────────────────────
// Note: the webhook route lives under /api/paper/webhook/:token and is
// intentionally not rate-limited (see limiter skip above).
app.use("/api/paper", paperTradingRoutes);

// ── AI Quant Assistant ────────────────────────────────────────────────────────
app.use("/api/assistant", assistantRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Priyadarshi Quant Lab API v3 running on port ${PORT}`);
});

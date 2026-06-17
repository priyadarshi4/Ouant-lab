import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import connectDB from "./config/db.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

import authRoutes from "./routes/authRoutes.js";
import strategyRoutes from "./routes/strategyRoutes.js";
import backtestRoutes from "./routes/backtestRoutes.js";
import researchNoteRoutes from "./routes/researchNoteRoutes.js";
import codeVersionRoutes from "./routes/codeVersionRoutes.js";
import indicatorRoutes from "./routes/indicatorRoutes.js";
import attachmentRoutes from "./routes/attachmentRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";

dotenv.config();
connectDB();

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "*", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 });
app.use("/api", limiter);

app.get("/api/health", (req, res) => res.json({ status: "ok", service: "Priyadarshi Quant Lab API" }));

app.use("/api/auth", authRoutes);
app.use("/api/strategies", strategyRoutes);
app.use("/api/backtests", backtestRoutes);
app.use("/api/research-notes", researchNoteRoutes);
app.use("/api/code-versions", codeVersionRoutes);
app.use("/api/indicators", indicatorRoutes);
app.use("/api/attachments", attachmentRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/analytics", analyticsRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Priyadarshi Quant Lab API running on port ${PORT}`);
});

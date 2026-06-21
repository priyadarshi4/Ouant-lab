import express from "express";
import { extractFromScreenshot, importEquityCsv, extractUpload } from "../controllers/extractionController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);

// POST /api/extract/screenshot  — TradingView screenshot → pre-filled metrics JSON
router.post("/screenshot", extractUpload.single("file"), extractFromScreenshot);

// POST /api/extract/equity-csv/:backtestId — CSV → equityCurve array saved to backtest
router.post("/equity-csv/:id", extractUpload.single("file"), importEquityCsv);

export default router;

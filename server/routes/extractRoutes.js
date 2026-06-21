import express from "express";
import { extractFromScreenshot, extractEquityCsv, uploadScreenshot } from "../controllers/extractController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);

// POST /api/extract/screenshot   multipart: file (image), backtestId? (string)
router.post("/screenshot", uploadScreenshot.single("file"), extractFromScreenshot);

// POST /api/extract/equity-csv   multipart: file (csv), backtestId (string)
router.post("/equity-csv", uploadScreenshot.single("file"), extractEquityCsv);

export default router;

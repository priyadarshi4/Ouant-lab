import express from "express";
import {
  getReports,
  createReport,
  deleteReport,
  downloadReportPdf,
} from "../controllers/reportController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);

router.get("/", getReports);
router.post("/", createReport);
router.get("/:id/pdf", downloadReportPdf);
router.delete("/:id", deleteReport);

export default router;

import express from "express";
import {
  getReports,
  createReport,
  deleteReport,
  downloadReportPdf,
  downloadReportDocx,
  downloadReportHtml,
  autoGenerateReport,
} from "../controllers/reportController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);

router.get("/", getReports);
router.post("/", createReport);
router.post("/auto-generate", autoGenerateReport);
router.get("/:id/pdf", downloadReportPdf);
router.get("/:id/docx", downloadReportDocx);
router.get("/:id/html", downloadReportHtml);
router.delete("/:id", deleteReport);

export default router;

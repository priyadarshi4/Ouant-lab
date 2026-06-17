import express from "express";
import { getDashboardSummary, getCorrelationMatrix } from "../controllers/analyticsController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);

router.get("/dashboard", getDashboardSummary);
router.get("/correlation", getCorrelationMatrix);

export default router;

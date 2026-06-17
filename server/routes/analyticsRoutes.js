import express from "express";
import { getDashboardSummary, getCorrelationMatrix, getKnowledgeGraph } from "../controllers/analyticsController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);

router.get("/dashboard", getDashboardSummary);
router.get("/correlation", getCorrelationMatrix);
router.get("/knowledge-graph", getKnowledgeGraph);

export default router;

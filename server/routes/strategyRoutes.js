import express from "express";
import {
  getStrategies,
  getStrategyById,
  createStrategy,
  updateStrategy,
  deleteStrategy,
  toggleFavorite,
  updateScorecard,
  compareStrategies,
  getVersionHistory,
  rollbackVersion,
} from "../controllers/strategyController.js";
import { generateAiAnalysis } from "../controllers/aiAnalysisController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", getStrategies);
router.post("/", createStrategy);
router.post("/compare", compareStrategies);
router.get("/:id", getStrategyById);
router.put("/:id", updateStrategy);
router.delete("/:id", deleteStrategy);
router.patch("/:id/favorite", toggleFavorite);
router.patch("/:id/scorecard", updateScorecard);
router.get("/:id/versions", getVersionHistory);
router.post("/:id/versions/:snapshotId/rollback", rollbackVersion);
router.post("/:id/ai-analysis", generateAiAnalysis);

export default router;

import express from "express";
import {
  getPortfolios, getPortfolioById, createPortfolio, updatePortfolio,
  deletePortfolio, getPortfolioAnalytics, getRegimeAnalysis, computeAllocation,
} from "../controllers/portfolioController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);

router.get("/", getPortfolios);
router.post("/", createPortfolio);
router.get("/:id", getPortfolioById);
router.put("/:id", updatePortfolio);
router.delete("/:id", deletePortfolio);
router.get("/:id/analytics", getPortfolioAnalytics);
router.get("/:id/regime-analysis", getRegimeAnalysis);
router.post("/:id/allocate", computeAllocation);

export default router;

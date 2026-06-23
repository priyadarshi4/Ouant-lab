import express from "express";
import { getOptimizationRuns, createOptimizationRun, deleteOptimizationRun } from "../controllers/optimizationController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);

router.get("/", getOptimizationRuns);
router.post("/", createOptimizationRun);
router.delete("/:id", deleteOptimizationRun);

export default router;

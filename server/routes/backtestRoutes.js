import express from "express";
import {
  getBacktests,
  getBacktestById,
  createBacktest,
  updateBacktest,
  deleteBacktest,
} from "../controllers/backtestController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);

router.get("/", getBacktests);
router.post("/", createBacktest);
router.get("/:id", getBacktestById);
router.put("/:id", updateBacktest);
router.delete("/:id", deleteBacktest);

export default router;

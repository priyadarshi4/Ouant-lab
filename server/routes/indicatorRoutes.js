import express from "express";
import {
  getIndicators,
  createIndicator,
  updateIndicator,
  deleteIndicator,
} from "../controllers/indicatorController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);

router.get("/", getIndicators);
router.post("/", createIndicator);
router.put("/:id", updateIndicator);
router.delete("/:id", deleteIndicator);

export default router;

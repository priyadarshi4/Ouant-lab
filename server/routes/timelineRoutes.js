import express from "express";
import { getTimeline } from "../controllers/timelineController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);

router.get("/", getTimeline);

export default router;

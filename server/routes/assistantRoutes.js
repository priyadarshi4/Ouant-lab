import express from "express";
import { chat } from "../controllers/assistantController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);

router.post("/chat", chat);

export default router;

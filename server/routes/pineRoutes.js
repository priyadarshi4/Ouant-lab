import express from "express";
import { analyzePineScript, applyPineScriptAnalysis } from "../controllers/pineScriptController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);

router.post("/analyze", analyzePineScript);
router.post("/apply", applyPineScriptAnalysis);

export default router;

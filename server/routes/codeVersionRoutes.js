import express from "express";
import {
  getCodeVersions,
  createCodeVersion,
  deleteCodeVersion,
  diffCodeVersions,
} from "../controllers/codeVersionController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);

router.get("/", getCodeVersions);
router.post("/", createCodeVersion);
router.get("/diff", diffCodeVersions);
router.delete("/:id", deleteCodeVersion);

export default router;

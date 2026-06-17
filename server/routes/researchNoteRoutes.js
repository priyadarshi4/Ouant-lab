import express from "express";
import {
  getResearchNotes,
  createResearchNote,
  updateResearchNote,
  deleteResearchNote,
} from "../controllers/researchNoteController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);

router.get("/", getResearchNotes);
router.post("/", createResearchNote);
router.put("/:id", updateResearchNote);
router.delete("/:id", deleteResearchNote);

export default router;

import express from "express";
import {
  upload,
  uploadAttachment,
  getAttachments,
  deleteAttachment,
} from "../controllers/attachmentController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);

router.get("/", getAttachments);
router.post("/", upload.single("file"), uploadAttachment);
router.delete("/:id", deleteAttachment);

export default router;

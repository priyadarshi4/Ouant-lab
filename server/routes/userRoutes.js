import express from "express";
import { updateProfile, updateAvatar, updateBanner, uploadProfileImage } from "../controllers/userController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);

router.put("/me", updateProfile);
router.post("/me/avatar", uploadProfileImage.single("file"), updateAvatar);
router.post("/me/banner", uploadProfileImage.single("file"), updateBanner);

export default router;

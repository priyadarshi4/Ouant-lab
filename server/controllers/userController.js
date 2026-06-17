import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: { folder: "priyadarshi-quant-lab/profile" },
});

export const uploadProfileImage = multer({ storage });

const PROFILE_FIELDS = [
  "name", "bio", "education", "skills", "github", "linkedin", "portfolio",
  "researchInterests", "favoriteMarkets", "tradingStyle", "experienceLevel",
];

// PUT /api/users/me
export const updateProfile = asyncHandler(async (req, res) => {
  const updates = {};
  PROFILE_FIELDS.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });
  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  res.json({ user: user.toSafeObject() });
});

// POST /api/users/me/avatar  (multipart, field: "file")
export const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("No image received");
  }
  const user = await User.findByIdAndUpdate(req.user._id, { avatarUrl: req.file.path }, { new: true });
  res.json({ user: user.toSafeObject() });
});

// POST /api/users/me/banner  (multipart, field: "file")
export const updateBanner = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("No image received");
  }
  const user = await User.findByIdAndUpdate(req.user._id, { bannerUrl: req.file.path }, { new: true });
  res.json({ user: user.toSafeObject() });
});

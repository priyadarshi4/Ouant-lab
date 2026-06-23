import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";
import Attachment from "../models/Attachment.js";
import Backtest from "../models/Backtest.js";
import asyncHandler from "../utils/asyncHandler.js";
import { recomputeStrategyDerivedFields } from "../utils/recomputeStrategy.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: { folder: "priyadarshi-quant-lab" },
});

export const upload = multer({ storage });

// POST /api/attachments  (multipart/form-data, field name: "file")
export const uploadAttachment = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("No file received");
  }
  const { relatedStrategy, relatedBacktest, relatedResearchNote, category } = req.body;
  const ext = req.file.originalname.split(".").pop().toLowerCase();
  const fileType = ["png", "jpg", "jpeg", "gif", "webp"].includes(ext)
    ? "image"
    : ext === "pdf"
    ? "pdf"
    : ext === "csv"
    ? "csv"
    : "other";

  const attachment = await Attachment.create({
    uploadedBy: req.user._id,
    relatedStrategy: relatedStrategy || undefined,
    relatedBacktest: relatedBacktest || undefined,
    relatedResearchNote: relatedResearchNote || undefined,
    category: category || "Other",
    fileType,
    originalName: req.file.originalname,
    url: req.file.path,
    cloudinaryPublicId: req.file.filename,
  });

  if (relatedBacktest) {
    await Backtest.findByIdAndUpdate(relatedBacktest, { $push: { chartAttachments: attachment._id } });
  }
  await recomputeStrategyDerivedFields(relatedStrategy);

  res.status(201).json({ attachment });
});

export const getAttachments = asyncHandler(async (req, res) => {
  const { relatedStrategy, relatedBacktest } = req.query;
  const filter = {};
  if (relatedStrategy) filter.relatedStrategy = relatedStrategy;
  if (relatedBacktest) filter.relatedBacktest = relatedBacktest;
  const attachments = await Attachment.find(filter).sort({ createdAt: -1 });
  res.json({ count: attachments.length, attachments });
});

export const deleteAttachment = asyncHandler(async (req, res) => {
  const attachment = await Attachment.findById(req.params.id);
  if (!attachment) {
    res.status(404);
    throw new Error("Attachment not found");
  }
  if (attachment.cloudinaryPublicId) {
    await cloudinary.uploader.destroy(attachment.cloudinaryPublicId).catch(() => {});
  }
  await attachment.deleteOne();
  res.json({ message: "Attachment deleted" });
});

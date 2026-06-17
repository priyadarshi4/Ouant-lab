import Indicator from "../models/Indicator.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getIndicators = asyncHandler(async (req, res) => {
  const indicators = await Indicator.find().sort({ name: 1 });
  res.json({ count: indicators.length, indicators });
});

export const createIndicator = asyncHandler(async (req, res) => {
  const indicator = await Indicator.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ indicator });
});

export const updateIndicator = asyncHandler(async (req, res) => {
  const indicator = await Indicator.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!indicator) {
    res.status(404);
    throw new Error("Indicator not found");
  }
  res.json({ indicator });
});

export const deleteIndicator = asyncHandler(async (req, res) => {
  const indicator = await Indicator.findByIdAndDelete(req.params.id);
  if (!indicator) {
    res.status(404);
    throw new Error("Indicator not found");
  }
  res.json({ message: "Indicator deleted" });
});

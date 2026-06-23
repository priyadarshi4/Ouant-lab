import ResearchNote from "../models/ResearchNote.js";
import asyncHandler from "../utils/asyncHandler.js";
import { logTimelineEvent } from "./timelineController.js";

export const getResearchNotes = asyncHandler(async (req, res) => {
  const { strategy, type } = req.query;
  const filter = {};
  if (strategy) filter.strategy = strategy;
  if (type) filter.type = type;
  const notes = await ResearchNote.find(filter)
    .populate("author", "name")
    .populate("strategy", "name")
    .sort({ createdAt: -1 });
  res.json({ count: notes.length, notes });
});

export const createResearchNote = asyncHandler(async (req, res) => {
  const note = await ResearchNote.create({ ...req.body, author: req.user._id });
  if (note.strategy) {
    await logTimelineEvent(note.strategy, "Research Note Added", `"${note.title}" (${note.type})`, req.user._id);
  }
  res.status(201).json({ note });
});

export const updateResearchNote = asyncHandler(async (req, res) => {
  const note = await ResearchNote.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!note) {
    res.status(404);
    throw new Error("Research note not found");
  }
  res.json({ note });
});

export const deleteResearchNote = asyncHandler(async (req, res) => {
  const note = await ResearchNote.findByIdAndDelete(req.params.id);
  if (!note) {
    res.status(404);
    throw new Error("Research note not found");
  }
  res.json({ message: "Research note deleted" });
});

import CodeVersion from "../models/CodeVersion.js";
import Strategy from "../models/Strategy.js";
import asyncHandler from "../utils/asyncHandler.js";
import { recomputeStrategyDerivedFields } from "../utils/recomputeStrategy.js";
import { logTimelineEvent } from "./timelineController.js";

export const getCodeVersions = asyncHandler(async (req, res) => {
  const { strategy } = req.query;
  const filter = {};
  if (strategy) filter.strategy = strategy;
  const versions = await CodeVersion.find(filter).populate("author", "name").sort({ createdAt: -1 });
  res.json({ count: versions.length, versions });
});

export const createCodeVersion = asyncHandler(async (req, res) => {
  const version = await CodeVersion.create({ ...req.body, author: req.user._id });
  await Strategy.findByIdAndUpdate(version.strategy, { $push: { codeVersions: version._id } });
  await recomputeStrategyDerivedFields(version.strategy);
  await logTimelineEvent(version.strategy, "Code Uploaded", `New code version: ${version.versionLabel}`, req.user._id);
  res.status(201).json({ version });
});

export const deleteCodeVersion = asyncHandler(async (req, res) => {
  const version = await CodeVersion.findByIdAndDelete(req.params.id);
  if (!version) {
    res.status(404);
    throw new Error("Code version not found");
  }
  await Strategy.findByIdAndUpdate(version.strategy, { $pull: { codeVersions: version._id } });
  await recomputeStrategyDerivedFields(version.strategy);
  res.json({ message: "Code version deleted" });
});

// GET /api/code-versions/diff?a=idA&b=idB  -> simple line diff for the UI to render
export const diffCodeVersions = asyncHandler(async (req, res) => {
  const { a, b } = req.query;
  const [versionA, versionB] = await Promise.all([CodeVersion.findById(a), CodeVersion.findById(b)]);
  if (!versionA || !versionB) {
    res.status(404);
    throw new Error("One or both code versions not found");
  }
  res.json({
    a: { id: versionA._id, label: versionA.versionLabel, lines: versionA.code.split("\n") },
    b: { id: versionB._id, label: versionB.versionLabel, lines: versionB.code.split("\n") },
  });
});

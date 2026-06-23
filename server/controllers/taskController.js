import Task from "../models/Task.js";
import Strategy from "../models/Strategy.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getGeminiClient, GEMINI_MODEL, cleanJsonResponse } from "../config/gemini.js";
import { logTimelineEvent } from "./timelineController.js";

export const getTasks = asyncHandler(async (req, res) => {
  const { strategy, status, type } = req.query;
  const filter = {};
  if (strategy) filter.strategy = strategy;
  if (status) filter.status = status;
  if (type) filter.type = type;
  const tasks = await Task.find(filter).sort({ priority: -1, createdAt: -1 });
  res.json({ count: tasks.length, tasks });
});

export const createTask = asyncHandler(async (req, res) => {
  const task = await Task.create({ ...req.body, createdBy: req.user._id });
  await logTimelineEvent(task.strategy, "Task Created", `New task: "${task.title}"`, req.user._id);
  res.status(201).json({ task });
});

export const updateTask = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  if (updates.status === "Done") updates.completedAt = new Date();
  const task = await Task.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!task) {
    res.status(404);
    throw new Error("Task not found");
  }
  if (updates.status === "Done") {
    await logTimelineEvent(task.strategy, "Task Completed", `Completed: "${task.title}"`, req.user._id);
  }
  res.json({ task });
});

export const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task) {
    res.status(404);
    throw new Error("Task not found");
  }
  res.json({ message: "Task deleted" });
});

// POST /api/tasks/suggest  body: { strategy: strategyId }
// Looks at gaps in the strategy's research record and asks Gemini to
// propose concrete next steps, tagged by task type. Falls back to a
// deterministic gap-checklist if no Gemini key is configured.
export const suggestTasks = asyncHandler(async (req, res) => {
  const { strategy: strategyId } = req.body;
  const strategy = await Strategy.findById(strategyId);
  if (!strategy) {
    res.status(404);
    throw new Error("Strategy not found");
  }

  const gaps = [];
  const doc = strategy.documentation || {};
  if (!doc.whenItFails?.trim()) gaps.push("No documented failure conditions (When It Fails)");
  if (!doc.riskAssumptions?.trim()) gaps.push("No documented risk assumptions");
  if (!strategy.mathematicalFramework?.length) gaps.push("No formulas in the Mathematical Framework section");
  if (strategy.maturityStage === "Idea" || strategy.maturityStage === "Prototype") gaps.push("No backtest logged yet");
  if (!strategy.riskManagement?.maxDrawdownAllowed) gaps.push("No max drawdown limit defined");

  const gemini = getGeminiClient();
  let suggestions;

  if (gemini && gaps.length) {
    try {
      const response = await gemini.models.generateContent({
        model: GEMINI_MODEL,
        contents:
          `A quant strategy named "${strategy.name}" (${strategy.strategyType}, maturity: ${strategy.maturityStage}) ` +
          `has these gaps in its research record: ${gaps.join("; ")}. ` +
          `Suggest 3-6 concrete, specific research tasks to close these gaps. ` +
          `Return ONLY a JSON array of objects: [{"type": "Research Task"|"Validation Task"|"Risk Task"|"Optimization Task"|"Open Question", "title": "short imperative title", "description": "1-2 sentence detail"}]. No markdown fences.`,
      });
      suggestions = JSON.parse(cleanJsonResponse(response.text || "[]"));
    } catch (err) {
      console.error("AI task suggestion failed, using fallback:", err.message);
    }
  }

  if (!suggestions) {
    suggestions = gaps.map((gap) => ({
      type: "Research Task",
      title: gap,
      description: "Flagged automatically from the strategy's research record.",
    }));
  }

  const created = await Task.insertMany(
    suggestions.map((s) => ({
      strategy: strategyId,
      type: s.type || "Research Task",
      title: s.title,
      description: s.description || "",
      aiGenerated: true,
      createdBy: req.user._id,
    }))
  );

  res.json({ count: created.length, tasks: created });
});

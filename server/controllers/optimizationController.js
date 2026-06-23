import OptimizationRun from "../models/OptimizationRun.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getGeminiClient, GEMINI_MODEL, cleanJsonResponse } from "../config/gemini.js";
import { logTimelineEvent } from "./timelineController.js";

export const getOptimizationRuns = asyncHandler(async (req, res) => {
  const { strategy } = req.query;
  const filter = {};
  if (strategy) filter.strategy = strategy;
  const runs = await OptimizationRun.find(filter).sort({ createdAt: -1 });
  res.json({ count: runs.length, runs });
});

export const createOptimizationRun = asyncHandler(async (req, res) => {
  const run = await OptimizationRun.create({ ...req.body, createdBy: req.user._id });

  // Stability score: for each result, count how many of its 4 "neighbours"
  // (adjacent param values on the X axis) have a profit factor within 20%
  // of its own. Score = mean of those ratios, 0-100.
  if (run.results?.length > 1) {
    const pfs = run.results.map((r) => r.metrics?.profitFactor || 0);
    const stabilities = pfs.map((pf, i) => {
      const neighbours = [pfs[i - 2], pfs[i - 1], pfs[i + 1], pfs[i + 2]].filter((v) => v != null);
      if (!neighbours.length || pf === 0) return 0;
      const withinRange = neighbours.filter((n) => Math.abs(n - pf) / pf < 0.2).length;
      return withinRange / neighbours.length;
    });
    run.stabilityScore = Math.round((stabilities.reduce((a, b) => a + b, 0) / stabilities.length) * 100);
  }

  // Try Gemini interpretation
  const gemini = getGeminiClient();
  if (gemini && run.results?.length) {
    try {
      const summary = run.results.slice(0, 30).map((r) => ({
        params: r.params,
        pf: r.metrics?.profitFactor,
        wr: r.metrics?.winRate,
        dd: r.metrics?.maxDrawdown,
      }));
      const response = await gemini.models.generateContent({
        model: GEMINI_MODEL,
        contents:
          `You are a quant researcher reviewing parameter optimization results for a trading strategy. ` +
          `The parameter being swept: "${run.paramAxisX}". Stability score: ${run.stabilityScore || "N/A"}/100. ` +
          `Here are up to 30 results: ${JSON.stringify(summary)}. ` +
          `In 3-5 sentences, interpret this optimization surface: highlight the optimal zone, assess overfitting risk, and give a concrete recommendation. Be specific.`,
      });
      run.aiInterpretation = response.text?.trim() || "";
    } catch { /* non-fatal */ }
  }

  await run.save();
  await logTimelineEvent(run.strategy, "Optimization Run", `"${run.name}" optimization logged (stability: ${run.stabilityScore || "N/A"})`, req.user._id);
  res.status(201).json({ run });
});

export const deleteOptimizationRun = asyncHandler(async (req, res) => {
  const run = await OptimizationRun.findByIdAndDelete(req.params.id);
  if (!run) { res.status(404); throw new Error("Optimization run not found"); }
  res.json({ message: "Optimization run deleted" });
});

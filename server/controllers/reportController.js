import PDFDocument from "pdfkit";
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx";
import Report from "../models/Report.js";
import Strategy from "../models/Strategy.js";
import Backtest from "../models/Backtest.js";
import ResearchNote from "../models/ResearchNote.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getGeminiClient, GEMINI_MODEL, cleanJsonResponse } from "../config/gemini.js";

const SECTION_ORDER = [
  ["executiveSummary", "Executive Summary"],
  ["strategyOverview", "Strategy Overview"],
  ["riskAnalysis", "Risk Analysis"],
  ["performanceAnalysis", "Performance Analysis"],
  ["backtestResults", "Backtest Results"],
  ["strengths", "Strengths"],
  ["weaknesses", "Weaknesses"],
  ["recommendations", "Recommendations"],
  ["researchNotes", "Research Notes"],
  ["appendix", "Appendix"],
];

const fmt = (v, suffix = "") => (typeof v === "number" ? `${v.toFixed(2)}${suffix}` : "N/A");

// Deterministic, data-grounded section drafting from whatever the strategy
// record actually contains. Used as the always-available fallback, and as
// the input fed to Gemini when GEMINI_API_KEY is configured.
function templateSections(strategy, latestBacktest, notes) {
  const m = latestBacktest?.metrics || {};
  return {
    executiveSummary: `${strategy.name} is a ${strategy.strategyType} strategy (status: ${strategy.status}, version ${strategy.version}). ${strategy.description || ""} Research maturity score: ${strategy.researchScore || 0}/100. Quant grade: ${strategy.scorecard?.grade || "Unrated"}.`,
    strategyOverview: `${strategy.documentation?.coreIdea || "Core idea not yet documented."}\n\nHypothesis: ${strategy.documentation?.hypothesis || "Not documented."}\n\nEdge: ${strategy.documentation?.edgeExplanation || "Not documented."}`,
    riskAnalysis: `Risk per trade: ${strategy.riskManagement?.riskPerTrade || "Not specified"}. Max drawdown allowed: ${strategy.riskManagement?.maxDrawdownAllowed || "Not specified"}. Observed max drawdown in latest backtest: ${fmt(m.maxDrawdown, "%")}.`,
    performanceAnalysis: latestBacktest
      ? `Latest backtest on ${latestBacktest.symbol} (${latestBacktest.timeframe}): net profit ${fmt(m.netProfit)}, win rate ${fmt(m.winRate, "%")}, profit factor ${fmt(m.profitFactor)}, Sharpe ${fmt(m.sharpeRatio)}, Sortino ${fmt(m.sortinoRatio)}, Calmar ${fmt(m.calmarRatio)}.`
      : "No backtests logged yet for this strategy.",
    backtestResults: latestBacktest
      ? `Total trades: ${m.totalTrades || 0} (${m.winningTrades || 0} winning / ${m.losingTrades || 0} losing). Long win rate ${fmt(m.longWinRate, "%")}, short win rate ${fmt(m.shortWinRate, "%")}. Largest win ${fmt(m.largestWin)}, largest loss ${fmt(m.largestLoss)}.`
      : "No backtest results to summarize.",
    strengths: strategy.documentation?.whyItShouldWork || "Not documented.",
    weaknesses: strategy.documentation?.whenItFails || strategy.failureConditions || "Not documented.",
    recommendations: strategy.researchScore < 50
      ? "Research record is still thin — prioritize filling out documentation, logging more backtests, and adding code versions before considering live deployment."
      : "Strategy has a reasonably complete research record. Consider walk-forward validation and paper trading before scaling capital.",
    researchNotes: notes.length
      ? notes.slice(0, 5).map((n) => `[${n.type}] ${n.title}: ${n.content.slice(0, 200)}`).join("\n\n")
      : "No research notes logged yet.",
    appendix: `Tags: ${(strategy.tags || []).join(", ") || "none"}. Mathematical framework entries: ${strategy.mathematicalFramework?.length || 0}.`,
  };
}

async function gatherReportContext(strategyId) {
  const strategy = await Strategy.findById(strategyId);
  if (!strategy) return null;
  const latestBacktest = await Backtest.findOne({ strategy: strategyId }).sort({ createdAt: -1 });
  const notes = await ResearchNote.find({ strategy: strategyId }).sort({ createdAt: -1 }).limit(10);
  return { strategy, latestBacktest, notes };
}

// POST /api/reports/auto-generate  body: { strategy: strategyId }
// Returns a sections object the user can review/edit before saving as a Report.
// If GEMINI_API_KEY is set, asks Gemini to turn the templated draft into
// polished analyst prose; otherwise returns the deterministic template as-is.
export const autoGenerateReport = asyncHandler(async (req, res) => {
  const { strategy: strategyId } = req.body;
  const context = await gatherReportContext(strategyId);
  if (!context) {
    res.status(404);
    throw new Error("Strategy not found");
  }
  const draft = templateSections(context.strategy, context.latestBacktest, context.notes);

  const gemini = getGeminiClient();
  if (!gemini) {
    return res.json({ sections: draft, aiAssisted: false });
  }

  try {
    const response = await gemini.models.generateContent({
      model: GEMINI_MODEL,
      contents:
        "Rewrite each section below into clear, professional quant-research analyst prose. " +
        "Keep all numbers and facts exactly as given — do not invent data. " +
        "Return ONLY valid JSON with the same keys, no markdown fences, no commentary.\n\n" +
        JSON.stringify(draft),
    });
    const cleaned = cleanJsonResponse(response.text || "");
    const polished = JSON.parse(cleaned);
    return res.json({ sections: { ...draft, ...polished }, aiAssisted: true });
  } catch (err) {
    console.error("AI report drafting failed, falling back to template:", err.message);
    return res.json({ sections: draft, aiAssisted: false });
  }
});

export const getReports = asyncHandler(async (req, res) => {
  const { strategy } = req.query;
  const filter = {};
  if (strategy) filter.strategy = strategy;
  const reports = await Report.find(filter).populate("strategy", "name").sort({ createdAt: -1 });
  res.json({ count: reports.length, reports });
});

export const createReport = asyncHandler(async (req, res) => {
  const report = await Report.create({ ...req.body, generatedBy: req.user._id });
  res.status(201).json({ report });
});

export const deleteReport = asyncHandler(async (req, res) => {
  const report = await Report.findByIdAndDelete(req.params.id);
  if (!report) {
    res.status(404);
    throw new Error("Report not found");
  }
  res.json({ message: "Report deleted" });
});

// GET /api/reports/:id/pdf -> streams a generated PDF straight to the client
export const downloadReportPdf = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id).populate("strategy");
  if (!report) {
    res.status(404);
    throw new Error("Report not found");
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${report.title.replace(/\s+/g, "_")}.pdf"`);

  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);

  doc.fontSize(20).text(report.title, { align: "center" });
  doc.moveDown();
  doc.fontSize(10).fillColor("gray").text(`Strategy: ${report.strategy?.name || "N/A"}`, { align: "center" });
  doc.moveDown(2);
  doc.fillColor("black");

  SECTION_ORDER.forEach(([key, label]) => {
    const content = report.sections?.[key];
    if (content) {
      doc.fontSize(14).text(label, { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).text(content, { align: "left" });
      doc.moveDown();
    }
  });

  doc.end();
});

// GET /api/reports/:id/docx -> streams a generated Word document
export const downloadReportDocx = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id).populate("strategy");
  if (!report) {
    res.status(404);
    throw new Error("Report not found");
  }

  const children = [
    new Paragraph({ text: report.title, heading: HeadingLevel.TITLE }),
    new Paragraph({
      children: [new TextRun({ text: `Strategy: ${report.strategy?.name || "N/A"}`, italics: true, color: "7C93B3" })],
    }),
    new Paragraph({ text: "" }),
  ];

  SECTION_ORDER.forEach(([key, label]) => {
    const content = report.sections?.[key];
    if (content) {
      children.push(new Paragraph({ text: label, heading: HeadingLevel.HEADING_2 }));
      content.split("\n").forEach((line) => children.push(new Paragraph({ text: line })));
      children.push(new Paragraph({ text: "" }));
    }
  });

  const doc = new Document({ sections: [{ children }] });
  const buffer = await Packer.toBuffer(doc);

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  res.setHeader("Content-Disposition", `attachment; filename="${report.title.replace(/\s+/g, "_")}.docx"`);
  res.send(buffer);
});

// GET /api/reports/:id/html -> standalone styled HTML document
export const downloadReportHtml = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id).populate("strategy");
  if (!report) {
    res.status(404);
    throw new Error("Report not found");
  }

  const sectionsHtml = SECTION_ORDER.map(([key, label]) => {
    const content = report.sections?.[key];
    if (!content) return "";
    const paras = content.split("\n").map((line) => `<p>${line}</p>`).join("");
    return `<section><h2>${label}</h2>${paras}</section>`;
  }).join("\n");

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>${report.title}</title>
<style>
  body { background:#05070A; color:#E6F1FF; font-family: Inter, sans-serif; max-width: 760px; margin: 40px auto; padding: 0 20px; }
  h1 { font-family: 'Space Grotesk', sans-serif; color:#00E5FF; }
  h2 { font-family: 'Space Grotesk', sans-serif; color:#00E5FF; border-bottom: 1px solid rgba(0,229,255,0.2); padding-bottom: 6px; margin-top: 36px; }
  .subtitle { color:#7C93B3; font-size: 14px; }
  section p { line-height: 1.6; color: #D7E6F5; }
</style></head>
<body>
  <h1>${report.title}</h1>
  <div class="subtitle">Strategy: ${report.strategy?.name || "N/A"} · Generated ${new Date(report.createdAt).toLocaleDateString()}</div>
  ${sectionsHtml}
</body></html>`;

  res.setHeader("Content-Type", "text/html");
  res.setHeader("Content-Disposition", `attachment; filename="${report.title.replace(/\s+/g, "_")}.html"`);
  res.send(html);
});

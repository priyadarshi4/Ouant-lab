import PDFDocument from "pdfkit";
import Report from "../models/Report.js";
import Strategy from "../models/Strategy.js";
import asyncHandler from "../utils/asyncHandler.js";

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

  const sectionOrder = [
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

  sectionOrder.forEach(([key, label]) => {
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

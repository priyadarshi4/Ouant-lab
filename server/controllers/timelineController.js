import TimelineEvent from "../models/TimelineEvent.js";
import asyncHandler from "../utils/asyncHandler.js";

// Imported by other controllers to silently log activity. Never throws -
// a timeline write failure should never break the action that triggered it.
export async function logTimelineEvent(strategyId, type, message, actorId, meta) {
  if (!strategyId) return;
  try {
    await TimelineEvent.create({ strategy: strategyId, type, message, actor: actorId, meta });
  } catch (err) {
    console.error("Failed to log timeline event:", err.message);
  }
}

// GET /api/timeline?strategy=:id
export const getTimeline = asyncHandler(async (req, res) => {
  const { strategy } = req.query;
  if (!strategy) {
    res.status(400);
    throw new Error("strategy query param is required");
  }
  const events = await TimelineEvent.find({ strategy })
    .populate("actor", "name")
    .sort({ createdAt: -1 })
    .limit(200);
  res.json({ count: events.length, events });
});

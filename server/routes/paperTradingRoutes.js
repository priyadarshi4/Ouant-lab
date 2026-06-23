import express from "express";
import {
  getPaperAccounts, getPaperAccountById, createPaperAccount,
  updatePaperAccount, deletePaperAccount, handleWebhook,
  manualSignal, markToMarket, getSignals,
  getTradeJournal, updateTradeJournalEntry, aiReviewTrade,
} from "../controllers/paperTradingController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Webhook is intentionally unauthenticated - the token in the URL is the
// authentication mechanism, matching TradingView's webhook model.
router.post("/webhook/:token", handleWebhook);

// Everything else requires a logged-in user.
router.use(protect);

router.get("/", getPaperAccounts);
router.post("/", createPaperAccount);
router.get("/:id", getPaperAccountById);
router.put("/:id", updatePaperAccount);
router.delete("/:id", deletePaperAccount);
router.post("/:id/signal", manualSignal);
router.post("/:id/mark-to-market", markToMarket);
router.get("/:id/signals", getSignals);
router.get("/:id/journal", getTradeJournal);
router.put("/:id/journal/:entryId", updateTradeJournalEntry);
router.post("/:id/journal/:entryId/ai-review", aiReviewTrade);

export default router;

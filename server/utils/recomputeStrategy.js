import Strategy from "../models/Strategy.js";
import Backtest from "../models/Backtest.js";
import CodeVersion from "../models/CodeVersion.js";
import Attachment from "../models/Attachment.js";
import PaperAccount from "../models/PaperAccount.js";
import { logTimelineEvent } from "../controllers/timelineController.js";

// Call this any time a backtest, code version, attachment, or paper account
// changes for a strategy - keeps researchScore and maturityStage in sync
// with the strategy's actual evidence rather than letting them go stale.
export async function recomputeStrategyDerivedFields(strategyId) {
  if (!strategyId) return null;
  const strategy = await Strategy.findById(strategyId);
  if (!strategy) return null;

  const [codeCount, backtestCount, attachmentCount, bestBacktest, paperAccounts] = await Promise.all([
    CodeVersion.countDocuments({ strategy: strategyId }),
    Backtest.countDocuments({ strategy: strategyId }),
    Attachment.countDocuments({ relatedStrategy: strategyId }),
    Backtest.findOne({ strategy: strategyId }).sort({ createdAt: -1 }),
    PaperAccount.find({ strategy: strategyId }),
  ]);

  strategy.computeResearchScore(codeCount, backtestCount, attachmentCount);

  const hasWalkForward = !!bestBacktest?.walkForward?.outOfSampleResults?.trim();
  const paperTradeCount = paperAccounts.reduce((sum, a) => sum + (a.closedTrades?.length || 0), 0);
  const paperRealizedPnl = paperAccounts.reduce((sum, a) => sum + (a.realizedPnl || 0), 0);

  const previousStage = strategy.maturityStage;
  strategy.computeMaturityStage({
    hasCode: codeCount > 0,
    backtestCount,
    bestBacktest,
    hasWalkForward,
    paperTradeCount,
    paperRealizedPnl,
  });

  await strategy.save();

  if (previousStage && previousStage !== strategy.maturityStage) {
    await logTimelineEvent(
      strategyId,
      "Maturity Stage Changed",
      `Maturity advanced from "${previousStage}" to "${strategy.maturityStage}"`
    );
  }

  return strategy;
}

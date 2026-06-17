import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import Strategy from "../models/Strategy.js";
import Backtest from "../models/Backtest.js";
import Indicator from "../models/Indicator.js";

dotenv.config();

const run = async () => {
  await connectDB();

  let user = await User.findOne({ email: "demo@priyadarshiquantlab.com" });
  if (!user) {
    user = await User.create({
      name: "Demo Researcher",
      email: "demo@priyadarshiquantlab.com",
      password: "demoPassword123",
      role: "researcher",
    });
    console.log("Created demo user: demo@priyadarshiquantlab.com / demoPassword123");
  }

  const rsi2 = await Indicator.findOneAndUpdate(
    { name: "RSI(2)" },
    {
      name: "RSI(2)",
      purpose: "Detect short-term overbought/oversold exhaustion",
      formula: "RSI = 100 - (100 / (1 + RS)), RS = avg gain / avg loss over 2 periods",
      parameters: "length=2",
      interpretation: "Below 10 = oversold snap-back zone, above 90 = overbought fade zone",
      createdBy: user._id,
    },
    { upsert: true, new: true }
  );

  let strategy = await Strategy.findOne({ name: "RSI(2) Mean Reversion - Nifty50" });
  if (!strategy) {
    strategy = await Strategy.create({
      name: "RSI(2) Mean Reversion - Nifty50",
      strategyType: "Mean Reversion",
      version: "v1.0",
      author: user._id,
      status: "Testing",
      tags: ["rsi", "mean-reversion", "nifty50"],
      description: "Short-term RSI(2) extreme reversal strategy on Nifty 50 daily timeframe.",
      executiveSummary: "A short-term mean reversion system that fades RSI(2) extremes in the direction of the dominant trend, targeting 60-90 trades per year on Nifty 50.",
      failureConditions: "Strong directional breakouts and high-volatility crash regimes where extremes keep extending rather than reverting.",
      marketRegimes: "Performs best in range-bound and mildly trending markets; underperforms in strong trends and crash regimes.",
      conclusion: "A solid baseline mean-reversion strategy with a thin-but-growing research record. Needs more out-of-sample validation before scaling capital.",
      mathematicalFramework: [
        { label: "RSI(2)", latex: "RSI = 100 - \\frac{100}{1 + RS}, \\quad RS = \\frac{AvgGain}{AvgLoss}", note: "2-period RSI used for entry exhaustion signal." },
        { label: "Position Sizing", latex: "Risk = AccountSize \\times RiskPercent", note: "0.5% account risk per trade." },
      ],
      documentation: {
        coreIdea: "Fade short-term price extremes when RSI(2) signals exhaustion against the prevailing trend.",
        hypothesis: "Markets overreact in the short term and mean-revert after extreme RSI readings.",
        whenItWorks: "Range-bound and mildly trending markets with normal volatility.",
        whenItFails: "Strong trending breakouts and high-volatility crash regimes.",
      },
      entryConditions: { longEntryRules: "RSI(2) < 10 and price above 200 EMA" },
      exitConditions: { takeProfitLogic: "Exit when RSI(2) crosses back above 60" },
      riskManagement: { riskPerTrade: "0.5% of capital", maxDrawdownAllowed: "8%", positionSizingFormula: "Risk = AccountSize × RiskPercent" },
      indicators: [rsi2._id],
      scorecard: {
        profitabilityScore: 62, robustnessScore: 55, consistencyScore: 58,
        riskScore: 70, complexityScore: 20, finalQuantScore: 60, grade: "B",
      },
    });

    const equityCurve = [];
    let equity = 100000;
    for (let i = 0; i < 84; i++) {
      const change = (Math.random() - 0.42) * 600;
      equity += change;
      equityCurve.push({
        t: new Date(2024, 0, 1 + i * 3),
        equity: Math.round(equity),
        drawdown: Math.round(Math.min(0, change) * 0.4),
        benchmarkEquity: Math.round(100000 * (1 + i * 0.0015)),
      });
    }

    const monthlyReturns = Array.from({ length: 12 }, (_, i) => ({
      month: `2024-${String(i + 1).padStart(2, "0")}`,
      returnPct: Number(((Math.random() - 0.35) * 6).toFixed(2)),
    }));

    const rollingMetrics = Array.from({ length: 12 }, (_, i) => ({
      t: new Date(2024, i, 1),
      rollingSharpe: Number((1 + Math.random()).toFixed(2)),
      rollingProfitFactor: Number((2 + Math.random() * 2).toFixed(2)),
      rollingDrawdown: Number((-(Math.random() * 8)).toFixed(2)),
    }));

    await Backtest.create({
      strategy: strategy._id,
      exchange: "NSE",
      symbol: "NIFTY50",
      timeframe: "1D",
      dateRangeStart: new Date(2024, 0, 1),
      dateRangeEnd: new Date(2024, 11, 31),
      marketPhase: "Sideways",
      dataSource: "TradingView",
      initialCapital: 100000,
      commission: 0.03,
      slippage: 0.02,
      positionSize: "1 lot",
      positionSizingMethod: "Fixed fractional, 0.5% risk per trade",
      metrics: {
        netProfit: 18450, grossProfit: 26200, grossLoss: -7750, buyAndHoldReturn: 11.2, maxRunup: 22.4,
        profitFactor: 3.38, winRate: 64.2, sharpeRatio: 1.42, sortinoRatio: 1.85, calmarRatio: 2.1,
        maxDrawdown: 6.8, recoveryFactor: 2.7, expectancy: 219.6, averageTrade: 219.6,
        averageWin: 485, averageLoss: -258, largestWin: 1850, largestLoss: -920,
        totalTrades: 84, winningTrades: 54, losingTrades: 30, longTrades: 60, shortTrades: 24,
        longWinRate: 66.7, shortWinRate: 58.3, averageBarsInTrade: 4.2, averageHoldingTime: "4.2 days",
        averageHoldingDays: 4, averageHoldingHours: 6, consecutiveWins: 6, consecutiveLosses: 3,
        largestWinStreak: 6, largestLossStreak: 3,
      },
      equityCurve,
      monthlyReturns,
      yearlyReturns: [{ year: "2024", returnPct: 18.45 }],
      rollingMetrics,
    });

    console.log("Seeded demo strategy + backtest with full Phase 2 data.");

    const codeCount = 0;
    strategy.computeResearchScore(codeCount, 1, 0);
    await strategy.save();
  }

  console.log("Seed complete.");
  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

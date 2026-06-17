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
      documentation: {
        coreIdea: "Fade short-term price extremes when RSI(2) signals exhaustion against the prevailing trend.",
        hypothesis: "Markets overreact in the short term and mean-revert after extreme RSI readings.",
        whenItWorks: "Range-bound and mildly trending markets with normal volatility.",
        whenItFails: "Strong trending breakouts and high-volatility crash regimes.",
      },
      entryConditions: { longEntryRules: "RSI(2) < 10 and price above 200 EMA" },
      exitConditions: { takeProfitLogic: "Exit when RSI(2) crosses back above 60" },
      riskManagement: { riskPerTrade: "0.5% of capital", maxDrawdownAllowed: "8%" },
      indicators: [rsi2._id],
      scorecard: {
        profitabilityScore: 62, robustnessScore: 55, consistencyScore: 58,
        riskScore: 70, complexityScore: 20, finalQuantScore: 60, grade: "B",
      },
    });

    await Backtest.create({
      strategy: strategy._id,
      exchange: "NSE",
      symbol: "NIFTY50",
      timeframe: "1D",
      initialCapital: 100000,
      commission: 0.03,
      slippage: 0.02,
      positionSize: "1 lot",
      metrics: {
        netProfit: 18450, grossProfit: 26200, grossLoss: -7750, profitFactor: 3.38,
        winRate: 64.2, sharpeRatio: 1.42, maxDrawdown: 6.8, totalTrades: 84,
        winningTrades: 54, losingTrades: 30, expectancy: 219.6,
      },
    });

    console.log("Seeded demo strategy + backtest.");
  }

  console.log("Seed complete.");
  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

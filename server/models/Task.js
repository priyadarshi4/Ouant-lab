import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    strategy: { type: mongoose.Schema.Types.ObjectId, ref: "Strategy", required: true, index: true },
    type: {
      type: String,
      enum: ["Open Question", "Research Task", "Validation Task", "Risk Task", "Optimization Task"],
      default: "Research Task",
    },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    status: { type: String, enum: ["Open", "In Progress", "Done"], default: "Open" },
    priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
    aiGenerated: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("Task", taskSchema);

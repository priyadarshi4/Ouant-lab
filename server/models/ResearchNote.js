import mongoose from "mongoose";

const researchNoteSchema = new mongoose.Schema(
  {
    strategy: { type: mongoose.Schema.Types.ObjectId, ref: "Strategy" },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["Daily Note", "Observation", "Experiment", "Failure", "Improvement", "Idea", "Lesson Learned"],
      default: "Daily Note",
    },
    title: { type: String, required: true },
    content: { type: String, required: true },
    attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Attachment" }],
  },
  { timestamps: true }
);

export default mongoose.model("ResearchNote", researchNoteSchema);

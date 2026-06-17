import mongoose from "mongoose";

const codeVersionSchema = new mongoose.Schema(
  {
    strategy: { type: mongoose.Schema.Types.ObjectId, ref: "Strategy", required: true },
    language: { type: String, enum: ["PineScript v5", "PineScript v6"], default: "PineScript v6" },
    versionLabel: { type: String, required: true }, // e.g. "v1.2"
    code: { type: String, required: true },
    changeLog: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("CodeVersion", codeVersionSchema);

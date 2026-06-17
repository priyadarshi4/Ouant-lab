import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ["admin", "researcher", "viewer"], default: "researcher" },
    avatarUrl: { type: String, default: "" },
    bannerUrl: { type: String, default: "" },
    bio: { type: String, default: "" },
    education: { type: String, default: "" },
    skills: [{ type: String, trim: true }],
    github: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    portfolio: { type: String, default: "" },
    researchInterests: [{ type: String, trim: true }],
    favoriteMarkets: [{ type: String, trim: true }],
    tradingStyle: { type: String, default: "" },
    experienceLevel: { type: String, enum: ["Beginner", "Intermediate", "Advanced", "Professional"], default: "Intermediate" },
    refreshTokens: [{ type: String, select: false }],
    favoriteStrategies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Strategy" }],
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    avatarUrl: this.avatarUrl,
    bannerUrl: this.bannerUrl,
    bio: this.bio,
    education: this.education,
    skills: this.skills,
    github: this.github,
    linkedin: this.linkedin,
    portfolio: this.portfolio,
    researchInterests: this.researchInterests,
    favoriteMarkets: this.favoriteMarkets,
    tradingStyle: this.tradingStyle,
    experienceLevel: this.experienceLevel,
    favoriteStrategies: this.favoriteStrategies,
    createdAt: this.createdAt,
  };
};

export default mongoose.model("User", userSchema);

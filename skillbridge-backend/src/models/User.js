const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true },
  googleId: String,
  role: { type: String, enum: ['student', 'mentor', 'admin'], default: 'student' },
  college: String,
  branch: String,
  semester: Number,
  subjects: [String],
  bio: String,
  socialLinks: { github: String, linkedin: String },
  reputation: { type: Number, default: 0 },
  lastLoginDate: Date,
  loginStreak: { type: Number, default: 0 }
}, {
  timestamps: true
});

module.exports = mongoose.model("User", userSchema);

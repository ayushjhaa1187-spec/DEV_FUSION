const mongoose = require("mongoose");

const mentorProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  subjects: [String],
  bio: String,
  fee: { type: Number, min: 0, max: 500, default: 0 },
  isApproved: { type: Boolean, default: false },
  applicationStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  avgRating: { type: Number, default: 0 },
  totalSessions: { type: Number, default: 0 }
}, {
  timestamps: true
});

module.exports = mongoose.model("MentorProfile", mentorProfileSchema);

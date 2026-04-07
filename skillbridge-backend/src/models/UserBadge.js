const mongoose = require("mongoose");

const userBadgeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  badgeId: { type: String, required: true },
  seenByUser: { type: Boolean, default: false }
}, {
  timestamps: true
});

userBadgeSchema.index({ userId: 1, badgeId: 1 }, { unique: true });

module.exports = mongoose.model("UserBadge", userBadgeSchema);

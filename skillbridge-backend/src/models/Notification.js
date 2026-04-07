const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, required: true },     // 'new_answer' | 'answer_accepted' | 'booking_confirmed' | 'session_reminder' | 'badge_earned' | 'reputation_update'
  title: { type: String, required: true },
  message: { type: String, required: true },
  entityId: { type: mongoose.Schema.Types.ObjectId },
  entityType: { type: String },
  isRead: { type: Boolean, default: false, index: true }
}, {
  timestamps: true
});

notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);

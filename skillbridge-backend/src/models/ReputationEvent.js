const mongoose = require("mongoose");

const reputationEventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  eventType: { type: String, required: true },       // 'answer_posted' | 'answer_accepted' | 'daily_login' | 'test_completed' | 'reversal'
  entityId: { type: mongoose.Schema.Types.ObjectId },
  points: { type: Number, required: true },
  idempotencyKey: { type: String, unique: true, required: true }    // SHA256 of eventType+userId+entityId
}, {
  timestamps: true
});

module.exports = mongoose.model("ReputationEvent", reputationEventSchema);

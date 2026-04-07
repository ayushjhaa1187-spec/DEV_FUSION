const mongoose = require("mongoose");

const emailQueueSchema = new mongoose.Schema({
  to: { type: String, required: true },
  subject: { type: String, required: true },
  html: { type: String, required: true },
  status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
  retries: { type: Number, default: 0 },
  scheduledAt: { type: Date, default: Date.now },
  sentAt: { type: Date }
}, {
  timestamps: true
});

module.exports = mongoose.model("EmailQueue", emailQueueSchema);

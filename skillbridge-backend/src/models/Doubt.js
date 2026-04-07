const mongoose = require("mongoose");

const doubtSchema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  contentJson: { type: Object, required: true },       // TipTap JSON stored as-is
  subject: { type: String, required: true, index: true },
  branch: { type: String, index: true },
  semester: { type: Number },
  tags: [String],
  status: { type: String, enum: ['open', 'answered', 'resolved'], default: 'open', index: true },
  viewCount: { type: Number, default: 0 },
  answerCount: { type: Number, default: 0 },
  acceptedAnswerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Answer' },
}, {
  timestamps: true
});

doubtSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Doubt", doubtSchema);

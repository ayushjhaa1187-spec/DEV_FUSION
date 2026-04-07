const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema({
  doubtId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doubt', required: true, index: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  contentJson: { type: Object, required: true },
  voteScore: { type: Number, default: 0 },
  isAccepted: { type: Boolean, default: false, index: true },
}, {
  timestamps: true
});

module.exports = mongoose.model("Answer", answerSchema);

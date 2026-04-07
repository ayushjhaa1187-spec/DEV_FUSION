const mongoose = require("mongoose");

const practiceAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'PracticeTest', required: true, index: true },
  answers: [{ type: Number }],      // index of selected option per question
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  startedAt: { type: Date, required: true },
  submittedAt: { type: Date, required: true },
  timeTaken: { type: Number }       // seconds
}, {
  timestamps: true
});

module.exports = mongoose.model("PracticeAttempt", practiceAttemptSchema);

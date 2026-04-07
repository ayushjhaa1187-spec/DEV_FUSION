const mongoose = require("mongoose");

const practiceTestSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  topic: { type: String, required: true },
  questions: [{
    text: { type: String, required: true },
    options: [{ type: String, required: true }],     // 4 options
    correctIndex: { type: Number, required: true },
    explanation: { type: String }
  }],
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  difficulty: { type: String }
}, {
  timestamps: true
});

module.exports = mongoose.model("PracticeTest", practiceTestSchema);

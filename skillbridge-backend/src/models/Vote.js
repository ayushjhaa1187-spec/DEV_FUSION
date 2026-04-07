const mongoose = require("mongoose");

const voteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  answerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Answer', required: true },
  value: { type: Number, enum: [1, -1], required: true }
});

voteSchema.index({ userId: 1, answerId: 1 }, { unique: true });

module.exports = mongoose.model("Vote", voteSchema);

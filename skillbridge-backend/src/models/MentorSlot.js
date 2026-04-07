const mongoose = require("mongoose");

const mentorSlotSchema = new mongoose.Schema({
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  startAt: { type: Date, required: true, index: true },
  endAt: { type: Date, required: true },
  status: { type: String, enum: ['open', 'booked', 'cancelled'], default: 'open', index: true },
  bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }
});

module.exports = mongoose.model("MentorSlot", mentorSlotSchema);

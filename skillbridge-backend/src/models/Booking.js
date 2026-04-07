const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'MentorSlot', required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'completed', 'payment_failed'], default: 'pending' },
  fee: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['free', 'pending', 'paid', 'failed'], default: 'pending' },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  meetingLink: String,
  reminderSent: { type: Boolean, default: false }
}, {
  timestamps: true
});

module.exports = mongoose.model("Booking", bookingSchema);

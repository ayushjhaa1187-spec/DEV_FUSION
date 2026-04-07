require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const MentorSlot = require("../models/MentorSlot");
const Booking = require("../models/Booking");
const { createNotification } = require("../services/notification.service");

async function checkReminders() {
  const soon = new Date(Date.now() + 31 * 60 * 1000); // 31 min window
  const edge = new Date(Date.now() + 29 * 60 * 1000);

  const slots = await MentorSlot.find({
    status: 'booked',
    startAt: { $gte: edge, $lte: soon }
  }).populate({
    path: 'bookingId',
    populate: { path: 'studentId mentorId' }
  });

  for (const slot of slots) {
    const booking = slot.bookingId;
    if (!booking || booking.reminderSent) continue;

    console.log(`Sending reminder for booking ${booking._id}`);

    await createNotification({
      userId: booking.studentId._id,
      type: 'session_reminder',
      title: 'Session Starting Soon!',
      message: `Your session with ${booking.mentorId.name} starts in 30 minutes.`,
      entityId: booking._id,
      entityType: 'booking'
    });

    await createNotification({
      userId: booking.mentorId._id,
      type: 'session_reminder',
      title: 'Session Reminder',
      message: `A session with ${booking.studentId.name} is starting in 30 minutes.`,
      entityId: booking._id,
      entityType: 'booking'
    });

    await Booking.findByIdAndUpdate(booking._id, { reminderSent: true });
  }
}

connectDB().then(() => {
    console.log("Reminder Worker Started...");
    setInterval(checkReminders, 5 * 60 * 1000); // every 5 mins
});

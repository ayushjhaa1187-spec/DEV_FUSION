const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const MentorSlot = require("../models/MentorSlot");
const MentorProfile = require("../models/MentorProfile");
const { createOrder, verifySignature } = require("../services/payment.service");
const { createNotification } = require("../services/notification.service");
const { queueEmail, bookingConfirmedEmail } = require("../services/email.service");

exports.createBooking = async (req, res, next) => {
  try {
    const { mentorId, slotId } = req.body;
    const student = req.user;

    const slot = await MentorSlot.findById(slotId);
    if (!slot || slot.status !== 'open') {
        return res.status(400).json({ message: "Slot is not available" });
    }

    const mentorProfile = await MentorProfile.findOne({ userId: mentorId });
    if (!mentorProfile) return res.status(404).json({ message: "Mentor not found" });

    // Handle free vs paid
    let order = null;
    let paymentStatus = 'pending';
    if (mentorProfile.fee > 0) {
        order = await createOrder({
            amount: mentorProfile.fee,
            receipt: `rcpt_${Date.now()}`
        });
    } else {
        paymentStatus = 'free';
    }

    const booking = await Booking.create({
      studentId: student._id,
      mentorId,
      slotId,
      fee: mentorProfile.fee,
      paymentStatus,
      razorpayOrderId: order?.id,
      status: 'pending'
    });

    res.status(201).json({ booking, razorpayOrder: order });
  } catch (err) {
    next(err);
  }
};

exports.verifyBooking = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    // 1. Verify Razorpay signature
    const isValid = verifySignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature
    });

    if (!isValid) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    // 2. Transactional Update
    const booking = await Booking.findById(bookingId).session(session).populate('studentId mentorId');
    if (!booking) throw new Error("Booking not found");

    const slot = await MentorSlot.findById(booking.slotId).session(session);
    if (!slot) throw new Error("Slot not found");

    // 3. Update booking.status = 'confirmed', paymentStatus = 'paid'
    booking.status = 'confirmed';
    booking.paymentStatus = 'paid';
    booking.razorpayPaymentId = razorpayPaymentId;
    booking.meetingLink = `https://meet.jit.si/skillbridge_${booking._id}`;
    await booking.save();

    // 4. Update slot.status = 'booked', slot.bookedBy = studentId
    slot.status = 'booked';
    slot.bookedBy = booking.studentId._id;
    slot.bookingId = booking._id;
    await slot.save();

    // 5. Commit transaction
    await session.commitTransaction();
    session.endSession();

    // 6. Notifications & Emails (Non-blocking)
    await createNotification({
      userId: booking.studentId._id,
      type: 'booking_confirmed',
      title: 'Booking Confirmed!',
      message: `Your session with ${booking.mentorId.name} is confirmed.`,
      entityId: booking._id,
      entityType: 'booking'
    });

    await createNotification({
      userId: booking.mentorId._id,
      type: 'booking_confirmed',
      title: 'New Session Booked!',
      message: `${booking.studentId.name} booked a session with you.`,
      entityId: booking._id,
      entityType: 'booking'
    });

    await queueEmail({
      to: booking.studentId.email,
      ...bookingConfirmedEmail({
        mentorName: booking.mentorId.name,
        date: slot.startAt.toLocaleDateString(),
        time: slot.startAt.toLocaleTimeString(),
        meetingLink: booking.meetingLink
      })
    });

    res.json({ message: "Booking confirmed", booking });
  } catch (err) {
    console.error("Verification failed:", err);
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

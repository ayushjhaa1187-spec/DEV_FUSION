const MentorProfile = require("../models/MentorProfile");
const User = require("../models/User");
const MentorSlot = require("../models/MentorSlot");
const { generateSlots } = require("../services/slot.service");

exports.applyAsMentor = async (req, res, next) => {
  try {
    const { subjects, bio, fee } = req.body;
    
    let profile = await MentorProfile.findOne({ userId: req.user._id });
    if (profile) return res.status(400).json({ message: "Mentor application already submitted." });

    profile = await MentorProfile.create({
      userId: req.user._id,
      subjects,
      bio,
      fee: fee || 0
    });

    res.status(201).json({ profile });
  } catch (err) {
    next(err);
  }
};

exports.getMentorProfile = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user._id;
    const profile = await MentorProfile.findOne({ userId }).populate('userId', 'name role college branch');
    if (!profile) return res.status(404).json({ message: "Mentor profile not found" });
    res.json(profile);
  } catch (err) {
    next(err);
  }
};

exports.getAllMentors = async (req, res, next) => {
  try {
    const { subject, minFee, maxFee } = req.query;
    const query = { isApproved: true };

    if (subject) query.subjects = { $in: [subject] };
    if (minFee || maxFee) {
        query.fee = {};
        if (minFee) query.fee.$gte = parseInt(minFee);
        if (maxFee) query.fee.$lte = parseInt(maxFee);
    }

    const mentors = await MentorProfile.find(query).populate('userId', 'name college reputation');
    res.json(mentors);
  } catch (err) {
    next(err);
  }
};

exports.getSlots = async (req, res, next) => {
  try {
    const { mentorId } = req.params;
    const slots = await MentorSlot.find({ 
        mentorId, 
        startAt: { $gte: new Date() },
        status: { $ne: 'cancelled' }
    }).sort({ startAt: 1 });
    res.json(slots);
  } catch (err) {
    next(err);
  }
};

exports.createSlots = async (req, res, next) => {
  try {
    const { date, startTime, endTime } = req.body;
    const slots = await generateSlots({
        mentorId: req.user._id,
        date,
        startTime: startTime || "09:00",
        endTime: endTime || "17:00"
    });
    res.status(201).json(slots);
  } catch (err) {
    next(err);
  }
};

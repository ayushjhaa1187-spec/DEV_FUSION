const crypto = require("crypto");
const ReputationEvent = require("../models/ReputationEvent");
const User = require("../models/User");
const { checkAndAwardBadges } = require("./badge.service");

const POINT_VALUES = {
  answer_posted: 10,
  answer_accepted: 25,
  daily_login: 2,
  test_completed: 5,
  doubt_resolved: 3,
  first_answer_of_day: 5,
  reversal: 0   // handled with explicit negative points field
};

async function awardPoints({ userId, eventType, entityId, points }) {
  const finalPoints = points ?? POINT_VALUES[eventType] ?? 0;
  const key = crypto
    .createHash("sha256")
    .update(`${eventType}:${userId}:${entityId}`)
    .digest("hex");

  try {
    const existing = await ReputationEvent.findOne({ idempotencyKey: key });
    if (existing) return;

    await ReputationEvent.create({
      userId, 
      eventType, 
      entityId,
      points: finalPoints,
      idempotencyKey: key
    });

    await User.findByIdAndUpdate(userId, {
      $inc: { reputation: finalPoints }
    });

    await checkAndAwardBadges(userId);
  } catch (err) {
    if (err.code === 11000) return; // Duplicate — already awarded
    throw err;
  }
}

async function reversePoints({ userId, eventType, entityId }) {
  const points = -(POINT_VALUES[eventType] ?? 0);
  await awardPoints({ userId, eventType: 'reversal', entityId, points });
}

module.exports = { awardPoints, reversePoints, POINT_VALUES };

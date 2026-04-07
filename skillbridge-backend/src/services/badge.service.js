const User = require("../models/User");
const Answer = require("../models/Answer");
const UserBadge = require("../models/UserBadge");

const BADGE_CHECKS = [
  {
    id: "first_answer",
    check: async (userId) => {
      const count = await Answer.countDocuments({ authorId: userId });
      return count >= 1;
    }
  },
  {
    id: "helpful_5",
    check: async (userId) => {
      const count = await Answer.countDocuments({ authorId: userId, isAccepted: true });
      return count >= 5;
    }
  },
  {
    id: "streak_7",
    check: async (userId) => {
      const user = await User.findById(userId).select("loginStreak");
      return user && user.loginStreak >= 7;
    }
  }
];

async function checkAndAwardBadges(userId) {
  // notification service should be required here to avoid circular dep if needed
  const { createNotification } = require("./notification.service");

  for (const badge of BADGE_CHECKS) {
    const alreadyHas = await UserBadge.exists({ userId, badgeId: badge.id });
    if (alreadyHas) continue;
    
    const earned = await badge.check(userId);
    if (earned) {
      await UserBadge.create({ userId, badgeId: badge.id });
      await createNotification({
        userId,
        type: "badge_earned",
        title: "New Badge Earned!",
        message: `You earned the "${badge.id}" badge.`,
        entityId: userId,
        entityType: "badge"
      });
    }
  }
}

module.exports = { checkAndAwardBadges };

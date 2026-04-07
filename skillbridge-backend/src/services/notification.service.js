const Notification = require("../models/Notification");
const { getIO } = require("../config/socket");

async function createNotification({ userId, type, title, message, entityId, entityType }) {
  const notif = await Notification.create({
    userId, type, title, message, entityId, entityType
  });

  try {
    const io = getIO();
    io.to(`user:${userId}`).emit("notification:new", {
      _id: notif._id,
      type,
      title,
      message,
      createdAt: notif.createdAt
    });
  } catch (err) {
    // Socket not initialized or other error, just log and continue
    console.warn("Socket.io notification emit failed:", err.message);
  }

  return notif;
}

module.exports = { createNotification };

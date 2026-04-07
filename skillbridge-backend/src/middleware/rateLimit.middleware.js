const aiUsageMap = new Map();

exports.aiRateLimit = (limit = 10) => (req, res, next) => {
  const userId = req.user?._id?.toString();
  if (!userId) return next();

  const today = new Date().toISOString().split('T')[0];
  const usageKey = `${userId}:${today}`;
  
  const currentUsage = aiUsageMap.get(usageKey) || 0;
  
  if (currentUsage >= limit) {
    return res.status(429).json({ message: "Daily AI limit reached." });
  }

  aiUsageMap.set(usageKey, currentUsage + 1);
  next();
};

// Periodic cleanup of map to avoid memory leak
setInterval(() => {
    const today = new Date().toISOString().split('T')[0];
    for (const [key] of aiUsageMap) {
        if (!key.endsWith(today)) {
            aiUsageMap.delete(key);
        }
    }
}, 3600 * 1000 * 24); // daily

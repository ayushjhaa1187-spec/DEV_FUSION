exports.requireMentor = (req, res, next) => {
  if (req.user?.role !== 'mentor' && req.user?.role !== 'admin') {
    return res.status(403).json({ message: "Access denied. Mentor role required." });
  }
  next();
};

exports.requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: "Access denied. Admin role required." });
  }
  next();
};

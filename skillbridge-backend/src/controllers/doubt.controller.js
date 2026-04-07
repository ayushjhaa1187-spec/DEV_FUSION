const Doubt = require("../models/Doubt");

exports.createDoubt = async (req, res, next) => {
  try {
    const { title, contentJson, subject, branch, semester, tags } = req.body;
    
    const doubt = await Doubt.create({
      authorId: req.user._id,
      title,
      contentJson,
      subject,
      branch,
      semester,
      tags
    });

    res.status(201).json(doubt);
  } catch (err) {
    next(err);
  }
};

exports.getDoubts = async (req, res, next) => {
  try {
    const { subject, branch, status, page = 1, limit = 10 } = req.query;
    
    const query = {};
    if (subject) query.subject = subject;
    if (branch) query.branch = branch;
    if (status) query.status = status;

    const doubts = await Doubt.find(query)
      .populate('authorId', 'name reputation')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Doubt.countDocuments(query);

    res.json({
      doubts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getDoubtById = async (req, res, next) => {
  try {
    const doubt = await Doubt.findById(req.params.id)
      .populate('authorId', 'name reputation')
      .populate('acceptedAnswerId');

    if (!doubt) {
      return res.status(404).json({ message: "Doubt not found" });
    }

    // Increment view count
    doubt.viewCount += 1;
    await doubt.save();

    res.json(doubt);
  } catch (err) {
    next(err);
  }
};

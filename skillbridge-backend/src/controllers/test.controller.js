const PracticeTest = require("../models/PracticeTest");
const PracticeAttempt = require("../models/PracticeAttempt");
const { generateMCQTest } = require("../services/gemini.service");
const { awardPoints } = require("../services/reputation.service");

exports.generateTest = async (req, res, next) => {
  try {
    const { subject, topic, difficulty, count = 10 } = req.body;
    
    // Call AI to generate questions
    const questions = await generateMCQTest({ subject, topic, count });

    const test = await PracticeTest.create({
      subject,
      topic,
      difficulty,
      questions,
      generatedBy: req.user._id
    });

    res.status(201).json(test);
  } catch (err) {
    next(err);
  }
};

exports.submitAttempt = async (req, res, next) => {
  try {
    const { testId, answers, startedAt, submittedAt } = req.body;
    
    const test = await PracticeTest.findById(testId);
    if (!test) return res.status(404).json({ message: "Test not found" });

    // Calculate score
    let score = 0;
    test.questions.forEach((q, idx) => {
        if (answers[idx] === q.correctIndex) {
            score += 1;
        }
    });

    const timeTaken = Math.round((new Date(submittedAt) - new Date(startedAt)) / 1000);

    const attempt = await PracticeAttempt.create({
      userId: req.user._id,
      testId,
      answers,
      score,
      totalQuestions: test.questions.length,
      startedAt,
      submittedAt,
      timeTaken
    });

    // Award points for completion
    await awardPoints({
      userId: req.user._id,
      eventType: 'test_completed',
      entityId: attempt._id
    });

    res.status(201).json(attempt);
  } catch (err) {
    next(err);
  }
};

exports.getAttempts = async (req, res, next) => {
    try {
        const attempts = await PracticeAttempt.find({ userId: req.user._id })
            .populate('testId', 'subject topic')
            .sort({ submittedAt: -1 });

        res.json(attempts);
    } catch (err) {
        next(err);
    }
};

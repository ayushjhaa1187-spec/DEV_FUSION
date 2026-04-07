const { solveDoubt } = require("../services/gemini.service");

exports.aiSolve = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ message: "No doubt text provided" });
    }

    // Call gemini.service.solveDoubt(req.body.text)
    const answer = await solveDoubt(text);

    // 4. Return { answer: string }
    res.json({ answer });

    // 5. Log usage for monitoring (optional logic if needed)
    console.log(`AI solved doubt for user ${req.user._id}`);
  } catch (err) {
    next(err);
  }
};

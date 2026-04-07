const Answer = require("../models/Answer");
const Doubt = require("../models/Doubt");
const { awardPoints, reversePoints } = require("../services/reputation.service");
const { createNotification } = require("../services/notification.service");
const { queueEmail, doubtAnsweredEmail } = require("../services/email.service");

exports.postAnswer = async (req, res, next) => {
  try {
    const { doubtId, contentJson } = req.body;
    
    const doubt = await Doubt.findById(doubtId).populate('authorId');
    if (!doubt) return res.status(404).json({ message: "Doubt not found" });

    const answer = await Answer.create({
      doubtId,
      authorId: req.user._id,
      contentJson
    });

    doubt.answerCount += 1;
    doubt.status = 'answered';
    await doubt.save();

    // Award points
    await awardPoints({ 
      userId: req.user._id, 
      eventType: 'answer_posted', 
      entityId: answer._id 
    });

    // Notify doubt author
    await createNotification({
      userId: doubt.authorId._id,
      type: 'new_answer',
      title: 'New Answer Received',
      message: `${req.user.name} answered your doubt: ${doubt.title}`,
      entityId: doubt._id,
      entityType: 'doubt'
    });

    // Queue email
    await queueEmail({
      to: doubt.authorId.email,
      ...doubtAnsweredEmail({
        doubtTitle: doubt.title,
        answerAuthor: req.user.name,
        doubtLink: `${process.env.CLIENT_URL}/doubts/${doubt._id}`
      })
    });

    res.status(201).json(answer);
  } catch (err) {
    next(err);
  }
};

exports.acceptAnswer = async (req, res, next) => {
  try {
    const answerId = req.params.id;
    const answer = await Answer.findById(answerId).populate('authorId');
    if (!answer) return res.status(404).json({ message: "Answer not found" });

    const doubt = await Doubt.findById(answer.doubtId);
    if (!doubt) return res.status(404).json({ message: "Doubt not found" });

    // 1. Verify req.user is the doubt owner
    if (doubt.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the doubt owner can accept an answer" });
    }

    // 2. Find current accepted answer — if exists, reverse its +25 points
    if (doubt.acceptedAnswerId) {
      const oldAccepted = await Answer.findById(doubt.acceptedAnswerId);
      if (oldAccepted) {
        oldAccepted.isAccepted = false;
        await oldAccepted.save();
        await reversePoints({
          userId: oldAccepted.authorId,
          eventType: 'answer_accepted',
          entityId: oldAccepted._id
        });
      }
    }

    // 3. Set new answer isAccepted = true
    answer.isAccepted = true;
    await answer.save();

    // 4. Update doubt.acceptedAnswerId, status = 'resolved'
    doubt.acceptedAnswerId = answer._id;
    doubt.status = 'resolved';
    await doubt.save();

    // 5. Award +25 to new answer author via awardPoints()
    await awardPoints({
      userId: answer.authorId._id,
      eventType: 'answer_accepted',
      entityId: answer._id
    });

    // 6. Create notification for the new accepted answer author
    await createNotification({
      userId: answer.authorId._id,
      type: 'answer_accepted',
      title: 'Your Answer was Accepted!',
      message: `Congratulations! Your answer for "${doubt.title}" was accepted as the best.`,
      entityId: doubt._id,
      entityType: 'doubt'
    });

    res.json(answer);
  } catch (err) {
    next(err);
  }
};

exports.getAnswersByDoubt = async (req, res, next) => {
  try {
    const { doubtId } = req.params;
    const answers = await Answer.find({ doubtId })
      .populate('authorId', 'name reputation')
      .sort({ isAccepted: -1, voteScore: -1, createdAt: 1 });

    res.json(answers);
  } catch (err) {
    next(err);
  }
};

const express = require("express");
const router = express.Router();
const answerController = require("../controllers/answer.controller");
const auth = require("../middleware/auth.middleware");

router.post("/", auth, answerController.postAnswer);
router.post("/:id/accept", auth, answerController.acceptAnswer);
router.get("/doubt/:doubtId", answerController.getAnswersByDoubt);

module.exports = router;

const express = require("express");
const router = express.Router();
const aiController = require("../controllers/ai.controller");
const auth = require("../middleware/auth.middleware");
const { aiRateLimit } = require("../middleware/rateLimit.middleware");

router.post("/solve", auth, aiRateLimit(10), aiController.aiSolve);

module.exports = router;

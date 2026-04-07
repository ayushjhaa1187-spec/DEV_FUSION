const express = require("express");
const router = express.Router();
const testController = require("../controllers/test.controller");
const auth = require("../middleware/auth.middleware");

router.post("/generate", auth, testController.generateTest);
router.post("/submit", auth, testController.submitAttempt);
router.get("/attempts", auth, testController.getAttempts);

module.exports = router;

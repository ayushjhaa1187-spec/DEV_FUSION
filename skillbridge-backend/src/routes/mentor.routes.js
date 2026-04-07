const express = require("express");
const router = express.Router();
const mentorController = require("../controllers/mentor.controller");
const auth = require("../middleware/auth.middleware");

router.post("/apply", auth, mentorController.applyAsMentor);
router.get("/profile", auth, mentorController.getMentorProfile);
router.get("/profile/:userId", auth, mentorController.getMentorProfile);
router.get("/directory", mentorController.getAllMentors);

router.get("/slots/:mentorId", mentorController.getSlots);
router.post("/slots", auth, mentorController.createSlots);

module.exports = router;

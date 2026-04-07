const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/booking.controller");
const auth = require("../middleware/auth.middleware");

router.post("/", auth, bookingController.createBooking);
router.post("/verify", auth, bookingController.verifyBooking);

module.exports = router;

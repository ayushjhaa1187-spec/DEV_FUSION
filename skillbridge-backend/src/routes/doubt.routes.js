const express = require("express");
const router = express.Router();
const doubtController = require("../controllers/doubt.controller");
const auth = require("../middleware/auth.middleware");

router.post("/", auth, doubtController.createDoubt);
router.get("/", doubtController.getDoubts);
router.get("/:id", doubtController.getDoubtById);

module.exports = router;

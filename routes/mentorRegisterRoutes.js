const express = require("express");
const router = express.Router();
const mentorRegisterController = require("../controllers/mentorRegisterController");

router.post("/mentor-register", mentorRegisterController);

module.exports = router;

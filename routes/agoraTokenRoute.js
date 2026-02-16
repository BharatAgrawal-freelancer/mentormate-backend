// routes/agoraRoutes.js
const express = require("express");
const router = express.Router();
const { createMentorToken, createMenteeToken } = require("../controllers/agoraTokenController");

router.post("/mentor/:requestId/token", createMentorToken);
router.post("/mentee/:requestId/token", createMenteeToken);

module.exports = router;

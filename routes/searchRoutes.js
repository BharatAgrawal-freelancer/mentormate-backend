const express = require("express");
const router = express.Router();
const { searchMentors } = require("../controllers/searchController");

// Mentor Search Route
router.get("/mentor-search", searchMentors);

module.exports = router;

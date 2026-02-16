const express = require("express");
const { createRequest } = require("../controllers/requestController");

const router = express.Router();

router.post("/request", createRequest);

module.exports = router;

const express = require("express");
const router = express.Router();
const multer = require("multer");

const profileController = require("../controllers/profileController");
const authMiddleware = require("../middlewares/authMiddleware");

const upload = multer({ dest: "uploads/" });


router.post(
  "/update-profile",
  authMiddleware,
  upload.single("profilePhoto"),
  profileController.updateProfile
);

router.post(
  "/verify-email-otp",
  authMiddleware,
  profileController.verifyEmailOtp
);


router.get(
  "/get-contacted-mentor",
  authMiddleware,
  profileController.getContactedMentors
);

router.post(
  "/get-contacted-mentor-profile",
  authMiddleware,
  profileController.getContactedMentorProfile
);

module.exports = router;

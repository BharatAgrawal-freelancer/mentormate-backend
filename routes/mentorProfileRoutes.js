const express = require("express");
const {
  getMentors,
  getMentorProfile,
  updateMentorProfile,
  getMenteeRequest,
  updatePendingRequest,
  getMentorById
} = require("../controllers/mentorController.js");
const {getReviewById} = require('../controllers/profileController.js') // Import the review controller 
const authMiddleware = require("../middlewares/authMiddleware");


const mentorRouter = express.Router();

mentorRouter.get("/mentor-data",  getMentors);


mentorRouter.post("/get-mentor-profile", getMentorProfile); 
mentorRouter.patch("/update-mentor-profile", updateMentorProfile); 
mentorRouter.post("/get-mentee-request", authMiddleware, getMenteeRequest); 
mentorRouter.patch("/update-pending-request", updatePendingRequest); 
mentorRouter.get('/mentor-data/:id', getMentorById);
mentorRouter.get('/reviews/:id', getReviewById); // Endpoint to get all mentors

module.exports = mentorRouter;

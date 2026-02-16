const Mentee = require("../models/mentee");
const cloudinary = require("../config/cloudinary");
const sendEmail = require("../middlewares/emailService");
const User = require("../models/user.js"); 
const Mentor = require("../models/mentor");
const Request = require("../models/request");
const ReviewRated = require("../models/reviewRated");

exports.updateProfile = async (req, res) => {
  try {
    const { type, name, age, gender, working, email, phone } = req.body;
    const userId = req.userId; 

    let updateData = {};

    if (type === "update-mentee") {
      updateData = { name, age, gender, working };
    }

    else if (type === "profile-photo-update" && req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "profile_photos"
      });
      updateData = { profilePhoto: result.secure_url };
    }

    else if (type === "email-update" && email) {
      const otp = Math.floor(100000 + Math.random() * 900000);
      req.app.locals[email] = otp; 
      const emailSent = await sendEmail(
        email,
        "Email Verification OTP",
        `Your OTP is ${otp}`
      );
      if (!emailSent) return res.status(500).json({ error: "Failed to send OTP" });
      return res.json({ message: "OTP sent to email" });
    }

  else if (type === "phone-update" && phone) {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { $set: { phone } },
      { new: true }
    );
    return res.json({ message: "Phone updated", user: updatedUser });
  } catch (err) {
    console.error("Error updating phone:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

    if (Object.keys(updateData).length > 0) {
      const updatedMentee = await Mentee.findOneAndUpdate(
        { userId },
        { $set: updateData },
        { new: true }
      );
      return res.json({ message: "Profile updated", mentee: updatedMentee });
    }

    res.status(400).json({ error: "Invalid update type or data missing" });

  } catch (err) {
    console.error("Update Profile Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.verifyEmailOtp = async (req, res) => {
  const { email, otp } = req.body;
  const userId = req.userId;

  try {
    
    if (req.app.locals[email] && req.app.locals[email] == otp) {
      
      
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: { email } },
        { new: true }
      );

      
      delete req.app.locals[email];

      return res.json({ message: "Email updated", user: updatedUser });
    }

    res.status(400).json({ error: "Invalid OTP" });

  } catch (err) {
    console.error("Error verifying email OTP:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getContactedMentors = async (req, res) => {
  try {
    const userId = req.userId;

    // mentee ko fetch karo aur relations populate karo
    const mentee = await Mentee.findOne({ userId })
      .populate("requestedMentor")    // Mentors
      .populate("request")            // Requests
      .populate("currentMentor");     // Current Mentor (Mentor model se)

    if (!mentee) return res.status(404).json({ error: "Mentee not found" });

    // contactedMentors => Request docs nikalo aur unme mentorId populate karo
    const contactedRequests = await Request.find({ _id: { $in: mentee.contactedMentors } })
      .populate("mentorId");  // Mentor model se populate

    // contactedMentors ko mentor objects me map karo
    const contactedMentors = contactedRequests.map(req => req.mentorId);

    // requestedMentor => directly populated mentors
    const requestedMentors = mentee.requestedMentor;

    // request => mentee ki requests, mentorId ke sath populate karke
    const menteeRequests = await Request.find({ _id: { $in: mentee.request } })
      .populate("mentorId");

    // currentMentor => already populated mentor
    const currentMentor = mentee.currentMentor;

    // final response
    res.json({
      contactedMentors,
      requestedMentors,
      requests: menteeRequests,
      currentMentor
    });

  } catch (err) {
    console.error("Get Contacted Mentors Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};



exports.getContactedMentorProfile = async (req, res) => {
  try {
    const { mentorId } = req.body;

    if (!mentorId) {
      return res.status(400).json({ error: "Mentor ID is required" });
    }

    const mentor = await Mentor.findById(mentorId)
     
    if (!mentor) {
      return res.status(404).json({ error: "Mentor not found" });
    }

    res.json({ mentor });
  } catch (err) {
    console.error("Get Contacted Mentor Profile Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
exports.getReviewById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find mentor and populate reviews, including reviewer info
    const mentor = await Mentor.findById(id).populate({
      path: "reviews",                   // populate reviews array
      populate: { path: "reviewer", select: "name profilePhoto" } // populate reviewer info
    });

    if (!mentor)
      return res.status(404).json({ success: false, message: "Mentor not found" });

    res.json({ success: true, data: mentor.reviews });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

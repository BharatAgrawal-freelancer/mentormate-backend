const jwt = require("jsonwebtoken");
const Request = require("../models/request");
const User = require("../models/user");
const Mentee = require("../models/mentee");
const Mentor = require("../models/mentor");
const sendEmail = require("../middlewares/emailService");

const createRequest = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const mentee = await Mentee.findOne({ userId });
    if (!mentee) {
      return res.status(404).json({ message: "Mentee not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { mentorId, schedule, messageSent } = req.body;
    const mentor = await Mentor.findById(mentorId).populate("userId"); 
    if (!mentor) {
      return res.status(404).json({ message: "Mentor not found" });
    }

    const mentorEmail = mentor.userId.email;
    const menteeEmail = user.email;

    // new request create karo
    const newRequest = new Request({
      menteeId: mentee._id,
      mentorId,
      amount: 0,
      transactionNumber: null,
      schedule,
      messageSent,
      status: "pending",
    });

    await newRequest.save();

    // mentee ke document ko update karo
    mentee.requestedMentor.push(mentorId);   // mentorId store
    mentee.request.push(newRequest._id);     // requestId store
    await mentee.save();

    // emails bhejo
    await sendEmail(
      menteeEmail,
      "Mentorship Request Sent",
      `Your request has been sent to mentor ${mentor.name}.`
    );

    await sendEmail(
      mentorEmail,
      "New Mentorship Request",
      `You have received a request from mentee ${mentee.name}.`
    );

    res.status(201).json({
      message: "Request created successfully and emails sent",
      request: newRequest,
    });
  } catch (error) {
    console.error("Error creating request:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports = { createRequest };

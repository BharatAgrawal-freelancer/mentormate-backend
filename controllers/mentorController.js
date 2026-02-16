const Mentor = require("../models/mentor.js");
const Request = require("../models/request.js");
const ReviewRated = require("../models/reviewRated.js"); // adjust path if needed


const getMentors = async (req, res) => {
  try {
    const mentor = await Mentor.findOne({ userId: req.userId }).select(
      "userId name profilePhoto categories currentJob pricing rating bio"
    );

    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: "Mentor profile not found"
      });
    }
console.log(mentor)
    return res.status(200).json({
      success: true,
      data: mentor   // ✅ object
    });

  } catch (error) {
    console.error("❌ Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};




const getMentorProfile = async (req, res) => {
  try {
    const { userId } = req.body; 
    const mentor = await Mentor.findById(userId);

    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: "Mentor not found",
      });
    }

    return res.json({
      success: true,
      mentor,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


const updateMentorProfile = async (req, res) => {
  try {
    const { mentorId } = req.body;
    const {
      name,
      profilePhoto,
      college,
      currentJob,
      bio,
      categories,
      videoLink,
      photos,
      experience,
    } = req.body;

    const mentor = await Mentor.findById(mentorId);
    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: "Mentor not found",
      });
    }

    if (name) mentor.name = name;
    if (profilePhoto) mentor.profilePhoto = profilePhoto;
    if (college) mentor.college = college;
    if (currentJob) mentor.currentJob = currentJob;
    if (bio) mentor.bio = bio;
    if (categories) mentor.categories = categories;
    if (videoLink) mentor.videoLink = videoLink;
    if (photos) mentor.photos = photos;
    if (experience) mentor.experience = experience;

    await mentor.save();

    return res.json({
      success: true,
      message: "Profile updated successfully",
      mentor,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};
const getMenteeRequest = async (req, res) => {
  try {
    const userId = req.userId; // 🔥 JWT se

    const mentor = await Mentor.findOne({ userId });

    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: "Mentor not found",
      });
    }

    const requests = await Request.find({ mentorId: mentor._id })
      .populate("menteeId", "name profilePhoto age gender working");

      console.log("Requests fetched:", requests);
    return res.json({
      success: true,
      requests,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updatePendingRequest = async (req, res) => {
  try {
    const { requestId } = req.body;

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: "Request ID is required",
      });
    }

    const existingRequest = await Request.findById(requestId);

    if (!existingRequest) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    if (existingRequest.status === "accepted") {
      return res.status(400).json({
        success: false,
        message: "Request is already accepted",
      });
    }

    existingRequest.status = "accepted";
    await existingRequest.save();

    return res.json({
      success: true,
      message: "Request status updated successfully",
      request: existingRequest,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

const getMentorById = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch mentor details
    const mentor = await Mentor.findById(id).select(
      "-password -email -phoneNumber -createdAt -updatedAt -videoLink"
    );

    if (!mentor) {
      return res
        .status(404)
        .json({ success: false, message: "Mentor not found" });
    }

    // Fetch and populate reviews
    const reviews = await ReviewRated.find({ mentorId: id })
      .populate("reviewer", "name profilePhoto") // fetch only name & profilePhoto
      .exec();

    return res.status(200).json({
      success: true,
      data: { ...mentor.toObject(), reviews },
    });
  } catch (error) {
    console.error("❌ Error fetching mentor by ID:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error, please try again later.",
    });
  }
};

module.exports = {
  getMentors,
  getMentorProfile,
  updateMentorProfile,
  getMenteeRequest,
  updatePendingRequest,
  getMentorById
};

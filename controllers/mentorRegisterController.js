const jwt = require("jsonwebtoken");
const Mentor = require("../models/mentor");
const User = require("../models/user");
const cloudinary = require("../config/cloudinary");

const mentorRegisterController = async (req, res) => {
  try {
    // ============================
    // 1️⃣ Get token
    // ============================
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // ============================
    // 2️⃣ Verify token
    // ============================
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        message: "Session expired. Please login again.",
      });
    }

    const userId = decoded.id;

    // ============================
    // 3️⃣ Find user from DB
    // ============================
    const user = await User.findById(userId).select("name email type");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ============================
    // 4️⃣ Prevent duplicate mentor
    // ============================
    const existingMentor = await Mentor.findOne({ userId });

    if (existingMentor) {
      return res.status(400).json({
        message: "You are already registered as a mentor",
      });
    }

    // ============================
    // 5️⃣ Cloudinary uploader
    // ============================
    const uploadImage = async (image) => {
      if (!image) return null;
      const uploaded = await cloudinary.uploader.upload(image, {
        folder: "mentors",
      });
      return uploaded.secure_url;
    };

    // ============================
    // 6️⃣ Body data
    // ============================
    const {
      exams,
      categories,
      college,
      currentJob,
      experience,
      profilePhoto,
      bio,
      pricing,
      language,
      videoLink,
      photos,
    } = req.body;

    // ============================
    // 7️⃣ Upload images
    // ============================
    const profilePhotoUrl = profilePhoto
      ? await uploadImage(profilePhoto)
      : null;

    const examsWithImages = await Promise.all(
      (exams || []).map(async (exam) => ({
        ...exam,
        image: exam.image ? await uploadImage(exam.image) : null,
      }))
    );

    const currentJobWithImage = currentJob
      ? {
          ...currentJob,
          image: currentJob.image
            ? await uploadImage(currentJob.image)
            : null,
        }
      : null;

    const experienceWithImages = await Promise.all(
      (experience || []).map(async (exp) => ({
        ...exp,
        image: exp.image ? await uploadImage(exp.image) : null,
      }))
    );

    const photosWithUpload = await Promise.all(
      (photos || []).map(async (img) => await uploadImage(img))
    );

    // ============================
    // 8️⃣ Create mentor
    // ============================
    const mentor = new Mentor({
      userId,
      name: user.name, // ✅ MAIN CHANGE HERE
      profilePhoto: profilePhotoUrl,
      exams: examsWithImages,
      categories,
      college,
      currentJob: currentJobWithImage,
      experience: experienceWithImages,
      bio,
      pricing,
      language,
      videoLink,
      photos: photosWithUpload,
    });

    await mentor.save();

    // ============================
    // 9️⃣ Update user role
    // ============================
    await User.findByIdAndUpdate(userId, {
      type: "mentor",
    });

    // ============================
    // ✅ Response
    // ============================
    return res.status(201).json({
      message: "Mentor application submitted successfully",
      mentorId: mentor._id,
      mentorName: user.name,
    });
  } catch (error) {
    console.error("Mentor Register Error:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = mentorRegisterController;

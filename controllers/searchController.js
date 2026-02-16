const Mentor = require("../models/mentor");

exports.searchMentors = async (req, res) => {
  try {
    const {
      id,
      userId,
      category,
      name,
      lang,
      exam,
      tags,
      review,
      randomise,
    } = req.query;

    let query = {};

    // 🔹 Filters
    if (id) query._id = id;
    if (userId) query.userId = userId;
    if (category) query.categories = { $regex: category, $options: "i" };
    if (name) query.name = { $regex: name, $options: "i" };
    if (lang) query.language = { $regex: lang, $options: "i" };
    if (exam) query["exams.name"] = { $regex: exam, $options: "i" };
    if (tags) query.categories = { $in: tags.split(",") };
    if (review) query.rating = { $gte: Number(review) };

    // 🔹 Fetch mentors with only required fields
    let mentors = await Mentor.find(query).select(
      "userId name profilePhoto categories currentJob pricing rating bio"
    );

    // 🔹 Randomise if requested
    if (randomise && mentors.length > 0) {
      mentors = mentors.sort(() => 0.5 - Math.random());
    }

    // 🔹 Handle empty result
    if (!mentors.length) {
      return res
        .status(404)
        .json({ success: false, message: "No mentors found" });
    }

    return res.status(200).json({
      success: true,
      count: mentors.length,
      mentors,
    });
  } catch (error) {
    console.error("❌ Error searching mentors:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error, please try again later.",
    });
  }
};

const mongoose = require("mongoose");
const { Schema } = mongoose;

const MenteeSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: String,
    age: Number,
    profilePhoto: String,
    gender: { type: String, enum: ["male", "female", "other"] },
    working: { type: String, enum: ["student", "professional", "employee"] },
    contactedMentors: [{ type: Schema.Types.ObjectId, ref: "Request" }],
    currentMentor: { type: Schema.Types.ObjectId, ref: "Mentor" },
    requestedMentor: [{ type: Schema.Types.ObjectId, ref: "Mentor" }],
    request: [{ type: Schema.Types.ObjectId, ref: "Request" }],
    searchHistory: [String],
    viewedMentors: [{ type: Schema.Types.ObjectId, ref: "Mentor" }],
    rejectedRequests: [{ type: Schema.Types.ObjectId, ref: "Request" }],
    totalPaybacks: [
      {
        transactionId: String,
        requestId: { type: Schema.Types.ObjectId, ref: "Request" },
      },
    ],
    complaints: [{ type: Schema.Types.ObjectId, ref: "Complaint" }],
    ratedReviews: [{ type: Schema.Types.ObjectId, ref: "ReviewRated" }],
    lastLogin: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Mentee", MenteeSchema);

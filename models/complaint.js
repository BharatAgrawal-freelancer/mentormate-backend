const mongoose = require("mongoose");

const ComplaintSchema = new mongoose.Schema(
  {
    category: { type: String, required: true },
    topic: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String },
    dateOfSubmission: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Complaint", ComplaintSchema);

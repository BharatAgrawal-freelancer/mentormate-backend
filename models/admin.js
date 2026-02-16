const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, required: true, unique: true },
    phone: String,
    password: String,
    lastLogin: Date,
    permission: { 
      type: String, 
      enum: ["superadmin", "moderator"], 
      default: "moderator" 
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Admin", AdminSchema);

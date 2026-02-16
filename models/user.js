const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    type: { type: String, required: true, default:"mentee" },
    verifyOtp: { type: String, default: '' },
    verifyOtpExpireAt: { type: Number, default: 0 },
    isAccountVerified: { type: Boolean, default: false },
    resetOtp: { type: String, default: '' },          
    resetOtpExpireAt: { type: Number, default: 0 }, 
    isMentor: { type: Boolean, default: false }
});

const userModel = mongoose.models.user || mongoose.model('User', userSchema);

module.exports = userModel;

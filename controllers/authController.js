const bcrypt = require('bcryptjs');
const userModel = require('../models/user.js');
const Mentee = require("../models/Mentee");
const jwt = require('jsonwebtoken');
const sendEmail = require('../middlewares/emailService.js');   

// ===== REGISTER =====
const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "Missing details" });
  }

  try {
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new userModel({
      name,
      email,
      password: hashedPassword,
      isAccountVerified: false,
    });

    // Generate OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.verifyOtp = otp;
    user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save();

    // 👉 Create default Mentee linked to this user
    const mentee = new Mentee({
      userId: user._id,
      name: name, // same as user name
    });
    await mentee.save();

    // Send verification email
    const verifyLink = `${process.env.CLIENT_URL}/verify-otp?userId=${user._id}`;
    await sendEmail(
      email,
      "Verify Your Account",
      `
      Welcome ${name}!\n
      Your account has been created.\n
      OTP: ${otp}\n
      Or click to verify: ${verifyLink}
      `
    );

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Response with token + user + mentee
    res.json({
      success: true,
      message: "Account created! OTP sent to your email.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      mentee: {
        id: mentee._id,
        name: mentee.name,
      },
    });

  } catch (error) {
    console.error("❌ Register error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ===== LOGIN =====
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }

  try {
    const user = await userModel.findOne({ email });
    if (!user)
      return res.status(400).json({
        success: false,
        message: 'Invalid email'
      });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({
        success: false,
        message: 'Invalid password'
      });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // ✅ ADD isMentor HERE
    res.json({
      success: true,
      token,
      isMentor: user.isMentor,
      type: user.type   // optional (mentor / mentee)
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ===== LOGOUT =====
const logout = async (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    });
    return res.json({ success: true, message: 'Logged out' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ===== SEND VERIFY OTP =====
const sendVerifyOtp = async (req, res) => {
  try {
    const { userId, email } = req.body;

    const user = userId
      ? await userModel.findById(userId)
      : email
      ? await userModel.findOne({ email })
      : null;

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user.isAccountVerified) return res.status(400).json({ success: false, message: "Account already verified" });

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.verifyOtp = otp;
    user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;

    await user.save();
    await sendEmail(user.email, "Account Verification OTP", `Your OTP is ${otp}`);

    res.json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ===== VERIFY EMAIL =====
const verifyEmail = async (req, res) => {
  const { userId, otp } = req.body;

  if (!userId || !otp) return res.status(400).json({ success: false, message: "Missing details" });

  try {
    const user = await userModel.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "Account not found" });

    if (!user.verifyOtp || user.verifyOtp !== otp) return res.status(400).json({ success: false, message: "Invalid OTP" });

    if (user.verifyOtpExpireAt < Date.now()) return res.status(400).json({ success: false, message: "OTP expired" });

    user.isAccountVerified = true;
    user.verifyOtp = "";
    user.verifyOtpExpireAt = 0;

    await user.save();

    return res.json({ success: true, message: "Account verified successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ===== CHECK AUTH =====
const isAuthenticated = async (req, res) => {
  try {
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ===== RESET OTP & PASSWORD =====
const sendResetOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

  try {
    const user = await userModel.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.resetOtp = otp;
    user.resetOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;

    await user.save();
    await sendEmail(user.email, 'Password Reset OTP', `Your OTP is ${otp}`);

    res.json({ success: true, message: 'OTP sent to your email' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) return res.status(400).json({ success: false, message: 'Missing details' });

  try {
    const user = await userModel.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!user.resetOtp || user.resetOtp !== otp) return res.status(400).json({ success: false, message: 'Invalid OTP' });

    if (user.resetOtpExpireAt < Date.now()) return res.status(400).json({ success: false, message: 'OTP expired' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetOtp = '';
    user.resetOtpExpireAt = 0;

    await user.save();
    return res.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  register,
  login,
  logout,
  sendVerifyOtp,
  verifyEmail,
  isAuthenticated,
  sendResetOtp,
  resetPassword,
};

const express = require('express');
const { login, logout, register, sendVerifyOtp, verifyEmail } = require('../controllers/authController.js');
const authMiddleware = require('../middlewares/authMiddleware.js');

const authRouter = express.Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/logout', logout);
authRouter.post('/send-verify-otp', authMiddleware, sendVerifyOtp);
authRouter.post('/verify-account', authMiddleware, verifyEmail);

module.exports = authRouter;

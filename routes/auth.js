import express from "express";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import { generateOTP, hashOTP } from "../utils/otp.js";
import { sendOTP } from "../utils/mailer.js";
import jwt from "jsonwebtoken";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

const matricRegex =
  /^(FOS|COS|FNG|FOL|FOE|FOA|PHC|BMS)\/\d{2}\/\d{2}\/\d{4,6}$/i;

//
// SIGNUP — STUDENTS ONLY
//
router.post("/signup", async (req, res) => {
  try {
    const { name, email, matric, password } = req.body;

    if (!name || !email || !matric || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const normalizedMatric = matric.toUpperCase();

    if (!matricRegex.test(normalizedMatric)) {
      return res.status(400).json({ message: "Invalid matric number" });
    }

    const existingUser = await User.findOne({ email });

    // 🔹 resend OTP if not verified
    if (existingUser) {
      if (!existingUser.isVerified) {
        const otp = generateOTP();
        const hashedOtp = await hashOTP(otp);

        existingUser.otp = hashedOtp;
        existingUser.otpExpiresAt = Date.now() + 10 * 60 * 1000;
        await existingUser.save();

        await sendOTP(email, otp);

        return res.status(200).json({ message: "OTP_RESENT" });
      }

      return res.status(409).json({ message: "Email already registered" });
    }

    const matricExists = await User.findOne({
      matricNumber: normalizedMatric,
    });

    if (matricExists) {
      return res
        .status(409)
        .json({ message: "Matric number already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = generateOTP();
    const hashedOtp = await hashOTP(otp);

    await User.create({
      name,
      email,
      matricNumber: normalizedMatric,
      password: hashedPassword,
      otp: hashedOtp,
      otpExpiresAt: Date.now() + 10 * 60 * 1000,
      role: "student",
    });

    await sendOTP(email, otp);

    res.status(201).json({ message: "OTP_SENT" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

//
// VERIFY OTP
//
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.otp || !user.otpExpiresAt) {
      return res.status(400).json({ message: "No OTP pending verification" });
    }

    if (Date.now() > user.otpExpiresAt) {
      return res.status(400).json({ message: "OTP expired" });
    }

    const isValid = await bcrypt.compare(otp, user.otp);

    if (!isValid) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiresAt = undefined;

    await user.save();

    res.status(200).json({ message: "ACCOUNT_VERIFIED" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

//
// LOGIN — STUDENT OR ADMIN
//
router.post("/login", async (req, res) => {
  try {
    const { matric, email, password } = req.body;

    if (!password || (!matric && !email)) {
      return res.status(400).json({ message: "Credentials required" });
    }

    let user = null;

    // 🔹 Admin login via email
    if (email) {
      user = await User.findOne({ email });
    }

    // 🔹 Student login via matric
    if (!user && matric) {
      user = await User.findOne({
        matricNumber: matric.toUpperCase(),
      });
    }

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 🔹 ONLY students must verify email
    if (user.role !== "admin" && !user.isVerified) {
      return res.status(403).json({ message: "Email not verified" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "LOGIN_SUCCESS",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        matric: user.matricNumber || null,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

//
// AUTH TEST
//
router.get("/me", protect, (req, res) => {
  res.json({
    message: "Authenticated",
    user: req.user,
  });
});

export default router;
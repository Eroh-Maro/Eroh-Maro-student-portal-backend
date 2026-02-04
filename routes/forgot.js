import express from "express";
import crypto from "crypto";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import { sendOTP } from "../utils/mailer.js";

const router = express.Router();

//
// REQUEST PASSWORD RESET
//
router.post("/forgot", async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  // Always return success for security
  if (!user) {
    return res.json({ message: "RESET_LINK_SENT" });
  }

  const token = crypto.randomBytes(32).toString("hex");

  user.resetToken = token;
  user.resetTokenExpires = Date.now() + 15 * 60 * 1000;
  await user.save();

  const link = `http://localhost:5173/reset-password/${token}`;

  await sendOTP(
    email,
    `Click this link to reset your password:\n${link}`
  );

  res.json({ message: "RESET_LINK_SENT" });
});

//
// RESET PASSWORD
//
router.post("/reset/:token", async (req, res) => {
  const { password } = req.body;

  const user = await User.findOne({
    resetToken: req.params.token,
    resetTokenExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }

  user.password = await bcrypt.hash(password, 10);
  user.resetToken = undefined;
  user.resetTokenExpires = undefined;

  await user.save();

  res.json({ message: "PASSWORD_RESET_SUCCESS" });
});

export default router;
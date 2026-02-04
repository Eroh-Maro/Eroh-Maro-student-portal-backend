import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import User from "./models/User.js";

dotenv.config();

const seedAdmin = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const existing = await User.findOne({ email: "admin@portal.com" });
  if (existing) {
    console.log("Admin already exists");
    process.exit();
  }

  const hashedPassword = await bcrypt.hash("Password123", 10);

  await User.create({
    name: "Super Admin",
    email: "admin@portal.com",
    matricNumber: "ADMIN",
    password: hashedPassword,
    isVerified: true,
    role: "admin",
  });

  console.log("Admin created successfully");
  process.exit();
};

seedAdmin();
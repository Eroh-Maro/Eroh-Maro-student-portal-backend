import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import courseRoutes from "./routes/course.js";
import forgotRoutes from "./routes/forgot.js";

dotenv.config();

const app = express();

/* ================= CORS ================= */
app.use(
  cors({
    origin: "https://student-portal-frontend-maoy.vercel.app",
    credentials: true,
  })
);

/* ================= Middleware ================= */
app.use(express.json());

/* ================= Routes ================= */
app.get("/", (req, res) => {
  res.send("Backend running");
});

app.use("/auth", authRoutes);
app.use("/courses", courseRoutes);
app.use("/auth", forgotRoutes);

/* ================= MongoDB ================= */
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  try {
    await mongoose.connect(process.env.MONGO_URI);
    isConnected = true;
    console.log("✅ MongoDB connected.");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
  }
};

await connectDB();

/* ================= Export for Vercel ================= */
export default app;
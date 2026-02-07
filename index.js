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

/* ================= MongoDB (Vercel-safe GLOBAL CACHE) ================= */

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGO_URI, {
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;
  console.log("✅ MongoDB connected");
  return cached.conn;
}

/* Connect DB BEFORE routes */
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("❌ DB connection failed:", err);
    res.status(500).json({ message: "Database connection failed" });
  }
});

/* ================= Routes ================= */
app.get("/", (req, res) => {
  res.send("Backend running");
});

app.use("/auth", authRoutes);
app.use("/courses", courseRoutes);
app.use("/auth", forgotRoutes);

/* ================= Export for Vercel ================= */
export default app;
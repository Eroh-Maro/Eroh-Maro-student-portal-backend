import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import courseRoutes from "./routes/course.js";
import forgotRoutes from "./routes/forgot.js";


dotenv.config();

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.get("/", (req, res) => {
  res.send("Backend running");
});

app.use("/auth", authRoutes);
app.use("/courses", courseRoutes);
app.use("/auth", forgotRoutes);


mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(5000, "0.0.0.0", () => {
      console.log("🚀 Backend running on port 5000");
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
  });
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    email: { type: String, required: true, unique: true },

    matricNumber: { type: String, required: true, unique: true },

    password: { type: String, required: true },

    isVerified: { type: Boolean, default: false },

    otp: String,
    otpExpiresAt: Date,

    // Registered courses (many-to-many with Course)
    courses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],

    // Password reset support (🔹 indexed for faster lookup)
    resetToken: { type: String, index: true },
    resetTokenExpires: Date,

    // Role system (for future admin panel)
    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
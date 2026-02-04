import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true }, // CSC201
    title: { type: String, required: true },               // Data Structures
    units: { type: Number, default: 3 },
    department: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Course", courseSchema);
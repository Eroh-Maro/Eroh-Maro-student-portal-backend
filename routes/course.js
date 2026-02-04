import express from "express";
import Course from "../models/Course.js";
import User from "../models/User.js";
import protect from "../middleware/authMiddleware.js";
import adminOnly from "../middleware/adminMiddleware.js";

const router = express.Router();

//
// GET all available courses (catalog)
//
router.get("/", protect, async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch {
    res.status(500).json({ message: "Failed to fetch courses" });
  }
});

//
// GET my registered courses
//
router.get("/my/list", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("courses");
    res.json(user.courses);
  } catch {
    res.status(500).json({ message: "Failed to fetch registered courses" });
  }
});

//
// ADD course to logged-in student
//
router.post("/:courseId", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user.courses.includes(req.params.courseId)) {
      user.courses.push(req.params.courseId);
      await user.save();
    }

    await user.populate("courses");
    res.json(user.courses);
  } catch {
    res.status(500).json({ message: "Failed to register course" });
  }
});

//
// REMOVE course from student
//
router.delete("/:courseId", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    user.courses = user.courses.filter(
      (c) => c.toString() !== req.params.courseId
    );

    await user.save();
    await user.populate("courses");

    res.json(user.courses);
  } catch {
    res.status(500).json({ message: "Failed to remove course" });
  }
});

//
// ================= ADMIN ROUTES =================
//

//
// ADMIN — create course
//
router.post("/admin/create", protect, adminOnly, async (req, res) => {
  try {
    const { code, title, units, department } = req.body;

    const exists = await Course.findOne({ code });
    if (exists) {
      return res.status(400).json({ message: "Course already exists" });
    }

    const course = await Course.create({ code, title, units, department });
    res.json(course);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

//
// ADMIN — delete course
//
router.delete("/admin/:id", protect, adminOnly, async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: "Course deleted" });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

//
// ADMIN — course statistics (student count)
//
router.get("/admin/stats", protect, adminOnly, async (req, res) => {
  try {
    const stats = await Course.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "courses",
          as: "students",
        },
      },
      {
        $project: {
          code: 1,
          title: 1,
          studentCount: { $size: "$students" },
        },
      },
    ]);

    res.json(stats);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
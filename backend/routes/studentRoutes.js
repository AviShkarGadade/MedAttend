const express = require("express")
const router = express.Router()
const { protect, authorize } = require("../middleware/auth")
const User = require("../models/User")
const Session = require("../models/Session")
const Attendance = require("../models/Attendance")

// @desc    Get student dashboard data
// @route   GET /api/student/dashboard
// @access  Private/Student
router.get("/dashboard", protect, authorize("student"), async (req, res) => {
  try {
    const student = req.user

    // Get upcoming sessions
    const upcomingSessions = await Session.find({
      department: student.department,
      year: student.year,
      status: "upcoming",
      date: { $gte: new Date() },
    })
      .populate("faculty", "name")
      .populate("department", "name")
      .populate("hospital", "name")
      .sort({ date: 1 })
      .limit(5)

    // Get recent attendance
    const recentAttendance = await Attendance.find({
      student: student._id,
    })
      .populate({
        path: "session",
        select: "title date startTime endTime location",
        populate: [
          { path: "department", select: "name" },
          { path: "hospital", select: "name" },
        ],
      })
      .sort({ createdAt: -1 })
      .limit(5)

    // Get attendance stats
    const attendanceStats = await Attendance.aggregate([
      { $match: { student: student._id } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ])

    // Format stats
    const stats = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      total: 0,
    }

    attendanceStats.forEach((stat) => {
      stats[stat._id] = stat.count
      stats.total += stat.count
    })

    // Calculate percentages
    if (stats.total > 0) {
      stats.presentPercentage = (stats.present / stats.total) * 100
      stats.absentPercentage = (stats.absent / stats.total) * 100
      stats.latePercentage = (stats.late / stats.total) * 100
      stats.excusedPercentage = (stats.excused / stats.total) * 100
    }

    res.status(200).json({
      success: true,
      data: {
        student: {
          name: student.name,
          id: student.studentId,
          department: student.department.name,
          year: student.year,
        },
        currentRotation: {
          hospital: "City General Hospital",
          department: "Cardiology",
          supervisor: "Dr. Sarah Williams",
          startDate: "2025-03-15",
          endDate: "2025-04-15",
        },
        attendanceStats: stats,
        upcomingSessions,
        recentAttendance,
      },
    })
  } catch (error) {
    console.error("Error fetching student dashboard data:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
})

module.exports = router


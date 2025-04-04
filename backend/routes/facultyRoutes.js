const express = require("express")
const router = express.Router()
const { protect, authorize } = require("../middleware/auth")
const User = require("../models/User")
const Session = require("../models/Session")
const Attendance = require("../models/Attendance")

// @desc    Get faculty dashboard data
// @route   GET /api/faculty/dashboard
// @access  Private/Faculty
router.get("/dashboard", protect, authorize("faculty"), async (req, res) => {
  try {
    const faculty = req.user

    // Get active sessions for today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const activeSessions = await Session.find({
      faculty: faculty._id,
      date: { $gte: today, $lt: tomorrow },
      status: "active",
    })
      .populate("department", "name")
      .populate("hospital", "name")

    // Get upcoming sessions
    const upcomingSessions = await Session.find({
      faculty: faculty._id,
      date: { $gt: tomorrow },
      status: "upcoming",
    })
      .populate("department", "name")
      .populate("hospital", "name")
      .sort({ date: 1 })
      .limit(5)

    // Get students in faculty's department
    const students = await User.find({
      role: "student",
      department: faculty.department,
    })
      .select("name studentId department year")
      .populate("department", "name")
      .limit(10)

    // Create a simplified response for now to fix the immediate issue
    console.log("Faculty dashboard data sent successfully")

    res.status(200).json({
      success: true,
      data: {
        faculty: {
          name: faculty.name,
          id: faculty.facultyId || faculty._id,
          department: faculty.department ? faculty.department.name : "",
          hospital: faculty.hospital ? faculty.hospital.name : "",
        },
        currentSessions: activeSessions || [],
        upcomingSessions: upcomingSessions || [],
        students: students || [],
      },
    })
  } catch (error) {
    console.error("Error fetching faculty dashboard data:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
})

// @desc    Mark manual attendance for multiple students
// @route   POST /api/faculty/manual-attendance/:sessionId
// @access  Private/Faculty
router.post("/manual-attendance/:sessionId", protect, authorize("faculty"), async (req, res) => {
  try {
    const { sessionId } = req.params
    const { attendanceRecords } = req.body

    if (!attendanceRecords || !Array.isArray(attendanceRecords)) {
      return res.status(400).json({
        success: false,
        message: "Attendance records are required and must be an array",
      })
    }

    // Verify the session exists and belongs to this faculty
    const session = await Session.findOne({
      _id: sessionId,
      faculty: req.user._id,
    })

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found or you don't have permission to access it",
      })
    }

    // Process each attendance record
    const results = await Promise.all(
      attendanceRecords.map(async (record) => {
        const { studentId, status, notes } = record

        // Find the student
        const student = await User.findById(studentId)
        if (!student) {
          return {
            studentId,
            success: false,
            message: "Student not found",
          }
        }

        // Check if attendance already exists
        let attendance = await Attendance.findOne({
          session: sessionId,
          student: studentId,
        })

        if (attendance) {
          // Update existing attendance
          attendance.status = status
          attendance.notes = notes
          attendance.verificationMethod = "manual"
          attendance.verifiedBy = req.user._id
          await attendance.save()

          return {
            studentId,
            success: true,
            message: "Attendance updated successfully",
          }
        } else {
          // Create new attendance record
          attendance = await Attendance.create({
            session: sessionId,
            student: studentId,
            status,
            notes,
            verificationMethod: "manual",
            verifiedBy: req.user._id,
            checkInTime: new Date(),
          })

          return {
            studentId,
            success: true,
            message: "Attendance marked successfully",
          }
        }
      }),
    )

    res.status(200).json({
      success: true,
      message: "Manual attendance processed",
      results,
    })
  } catch (error) {
    console.error("Error marking manual attendance:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
})

// Add a simple test route to validate the routing works
router.get("/test", (req, res) => {
  res.status(200).json({ message: "Faculty routes working" })
})

module.exports = router


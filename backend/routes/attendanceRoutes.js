const express = require("express")
const router = express.Router()
const { protect, authorize } = require("../middleware/auth")
const Session = require("../models/Session")
const User = require("../models/User")
const Attendance = require("../models/Attendance")

// @desc    Mark manual attendance by faculty
// @route   POST /api/attendance/manual
// @access  Private/Faculty
router.post("/manual", protect, authorize("faculty"), async (req, res) => {
  try {
    const { sessionId, studentId, status, notes } = req.body

    // Validate session
    const session = await Session.findById(sessionId)
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      })
    }

    // Check if faculty is authorized for this session
    if (session.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to mark attendance for this session",
      })
    }

    // Find student
    const student = await User.findOne({
      role: "student",
      _id: studentId,
    })

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      })
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

      if (status === "present" || status === "late") {
        attendance.checkInTime = attendance.checkInTime || new Date()
      }

      await attendance.save()
    } else {
      // Create new attendance record
      attendance = await Attendance.create({
        session: sessionId,
        student: studentId,
        status,
        notes,
        verificationMethod: "manual",
        verifiedBy: req.user._id,
        checkInTime: status === "present" || status === "late" ? new Date() : null,
      })
    }

    res.status(200).json({
      success: true,
      data: attendance,
      message: `Attendance marked as ${status}`,
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

// @desc    Bulk mark attendance by faculty
// @route   POST /api/attendance/bulk
// @access  Private/Faculty
router.post("/bulk", protect, authorize("faculty"), async (req, res) => {
  try {
    const { sessionId, attendanceRecords } = req.body

    // Validate session
    const session = await Session.findById(sessionId)
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      })
    }

    // Check if faculty is authorized for this session
    if (session.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to mark attendance for this session",
      })
    }

    // Process each attendance record
    const results = await Promise.all(
      attendanceRecords.map(async (record) => {
        try {
          const { studentId, status, notes } = record

          // Find student
          const student = await User.findOne({
            role: "student",
            _id: studentId,
          })

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

            if (status === "present" || status === "late") {
              attendance.checkInTime = attendance.checkInTime || new Date()
            }

            await attendance.save()
          } else {
            // Create new attendance record
            attendance = await Attendance.create({
              session: sessionId,
              student: studentId,
              status,
              notes,\
              verificationMethod: "manual\";
              attendance.verifiedBy = req.user._id,
              checkInTime: status === "present" || status === "late" ? new Date() : null
            });
          }

          return {
            studentId,
            success: true,
            attendanceId: attendance._id,
          }
        } catch (error) {
          return {
            studentId: record.studentId,
            success: false,
            message: error.message,
          }
        }
      }),
    )

    res.status(200).json({
      success: true,
      data: results,
      message: "Bulk attendance marking processed",
    })
  } catch (error) {
    console.error("Error marking bulk attendance:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
})

module.exports = router


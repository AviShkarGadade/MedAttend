const Attendance = require("../models/Attendance")
const Session = require("../models/Session")
const User = require("../models/User")
const Notification = require("../models/Notification")
const { calculateDistance } = require("../utils/geolocation")

// @desc    Mark attendance
// @route   POST /api/attendance
// @access  Private/Student
exports.markAttendance = async (req, res) => {
  try {
    const { sessionId, verificationMethod, location, qrCodeData } = req.body

    // Validate student
    if (req.user.role !== "student") {
      return res.status(403).json({
        success: false,
        message: "Only students can mark attendance",
      })
    }

    // Find session
    const session = await Session.findById(sessionId)
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      })
    }

    // Check if session is active
    if (session.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Attendance can only be marked for active sessions",
      })
    }

    // Check if student belongs to the session's department and year
    if (session.department.toString() !== req.user.department.toString() || session.year !== req.user.year) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to mark attendance for this session",
      })
    }

    // Check if attendance already exists
    const existingAttendance = await Attendance.findOne({
      session: sessionId,
      student: req.user._id,
    })

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: "Attendance already marked for this session",
      })
    }

    // Verify attendance based on method
    if (verificationMethod === "geolocation") {
      // Check if geolocation is enabled for the session
      if (!session.enableGeolocation) {
        return res.status(400).json({
          success: false,
          message: "Geolocation verification is not enabled for this session",
        })
      }

      // Validate location
      if (!location || !location.latitude || !location.longitude) {
        return res.status(400).json({
          success: false,
          message: "Location data is required for geolocation verification",
        })
      }

      // Calculate distance between student and session location
      const distance = calculateDistance(
        { latitude: location.latitude, longitude: location.longitude },
        { latitude: session.coordinates.latitude, longitude: session.coordinates.longitude },
      )

      // Check if student is within the allowed radius
      if (distance > session.radius) {
        return res.status(400).json({
          success: false,
          message: `You are ${Math.round(distance)}m away from the session location. Maximum allowed distance is ${session.radius}m.`,
        })
      }
    } else if (verificationMethod === "qrcode") {
      // Check if QR code is enabled for the session
      if (!session.enableQRCode) {
        return res.status(400).json({
          success: false,
          message: "QR code verification is not enabled for this session",
        })
      }

      // Validate QR code data
      if (!qrCodeData) {
        return res.status(400).json({
          success: false,
          message: "QR code data is required for QR code verification",
        })
      }

      try {
        const parsedData = JSON.parse(qrCodeData)

        // Verify session ID
        if (parsedData.sessionId !== sessionId) {
          return res.status(400).json({
            success: false,
            message: "Invalid QR code: session mismatch",
          })
        }

        // Verify secret
        if (parsedData.secret !== session.qrCodeSecret) {
          return res.status(400).json({
            success: false,
            message: "Invalid QR code: secret mismatch",
          })
        }

        // Verify expiry
        const expiry = new Date(parsedData.expiry)
        if (expiry < new Date()) {
          return res.status(400).json({
            success: false,
            message: "QR code has expired",
          })
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid QR code data",
        })
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid verification method",
      })
    }

    // Determine attendance status based on session start time
    const sessionDate = new Date(session.date)
    const [startHours, startMinutes] = session.startTime.split(":").map(Number)
    sessionDate.setHours(startHours, startMinutes, 0, 0)

    const now = new Date()
    const timeDifference = (now - sessionDate) / (1000 * 60) // Difference in minutes

    let status = "present"
    if (timeDifference > 15) {
      // If more than 15 minutes late
      status = "late"
    }

    // Create attendance record
    const attendance = await Attendance.create({
      session: sessionId,
      student: req.user._id,
      status,
      checkInTime: now,
      verificationMethod,
      location: location
        ? {
            latitude: location.latitude,
            longitude: location.longitude,
          }
        : undefined,
    })

    // Notify faculty
    await Notification.create({
      recipient: session.faculty,
      title: "New Attendance",
      message: `${req.user.name} has marked attendance for "${session.title}"`,
      type: "attendance",
      relatedTo: {
        model: "Attendance",
        id: attendance._id,
      },
    })

    // Populate the attendance object before sending the response
    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate({
        path: "session",
        select: "title date startTime endTime location department hospital",
        populate: [
          { path: "department", select: "name" },
          { path: "hospital", select: "name" },
        ],
      })
      .populate("student", "name studentId")

    res.status(201).json({
      success: true,
      data: populatedAttendance,
      message: `Attendance marked as ${status}`,
    })
  } catch (error) {
    console.error("Mark attendance error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Get attendance for a session
// @route   GET /api/sessions/:sessionId/attendance
// @access  Private/Faculty
exports.getSessionAttendance = async (req, res) => {
  try {
    const { sessionId } = req.params
    const { status } = req.query

    // Find session
    const session = await Session.findById(sessionId)
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      })
    }

    // Check authorization for faculty
    if (req.user.role === "faculty" && session.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view attendance for this session",
      })
    }

    // Build query
    const query = { session: sessionId }
    if (status) {
      query.status = status
    }

    // Get attendance records
    const attendance = await Attendance.find(query).populate("student", "name studentId").sort({ checkInTime: 1 })

    // Get all students in the department and year
    const students = await User.find({
      role: "student",
      department: session.department,
      year: session.year,
    }).select("_id name studentId")

    // Create a map of student IDs to attendance records
    const attendanceMap = attendance.reduce((map, record) => {
      map[record.student._id.toString()] = record
      return map
    }, {})

    // Create a complete attendance list including absent students
    const completeAttendance = students.map((student) => {
      const record = attendanceMap[student._id.toString()]
      if (record) {
        return record
      } else {
        return {
          _id: null,
          session: sessionId,
          student: {
            _id: student._id,
            name: student.name,
            studentId: student.studentId,
          },
          status: "absent",
          checkInTime: null,
          verificationMethod: null,
        }
      }
    })

    res.status(200).json({
      success: true,
      count: completeAttendance.length,
      data: completeAttendance,
    })
  } catch (error) {
    console.error("Get session attendance error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Update attendance
// @route   PUT /api/attendance/:id
// @access  Private/Faculty
exports.updateAttendance = async (req, res) => {
  try {
    const { status, notes } = req.body

    // Find attendance
    const attendance = await Attendance.findById(req.params.id).populate({
      path: "session",
      select: "faculty department",
    })

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      })
    }

    // Check authorization
    if (req.user.role === "faculty" && attendance.session.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this attendance record",
      })
    }

    // Update attendance
    attendance.status = status || attendance.status
    attendance.notes = notes || attendance.notes
    attendance.verifiedBy = req.user._id
    attendance.verificationMethod = "manual"

    await attendance.save()

    res.status(200).json({
      success: true,
      data: attendance,
    })
  } catch (error) {
    console.error("Update attendance error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Mark checkout
// @route   PUT /api/attendance/:id/checkout
// @access  Private/Student
exports.markCheckout = async (req, res) => {
  try {
    // Find attendance
    const attendance = await Attendance.findById(req.params.id)

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      })
    }

    // Check authorization
    if (attendance.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to checkout for this attendance record",
      })
    }

    // Check if already checked out
    if (attendance.checkOutTime) {
      return res.status(400).json({
        success: false,
        message: "Already checked out",
      })
    }

    // Update checkout time
    attendance.checkOutTime = new Date()
    await attendance.save()

    res.status(200).json({
      success: true,
      data: attendance,
      message: "Checkout successful",
    })
  } catch (error) {
    console.error("Mark checkout error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Get student attendance history
// @route   GET /api/attendance/history
// @access  Private/Student
exports.getAttendanceHistory = async (req, res) => {
  try {
    const { startDate, endDate, status, page = 1, limit = 10 } = req.query

    // Build query
    const query = { student: req.user._id }

    if (startDate && endDate) {
      query.checkInTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      }
    } else if (startDate) {
      query.checkInTime = { $gte: new Date(startDate) }
    } else if (endDate) {
      query.checkInTime = { $lte: new Date(endDate) }
    }

    if (status) {
      query.status = status
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Get attendance records
    const attendance = await Attendance.find(query)
      .populate({
        path: "session",
        select: "title date startTime endTime location department hospital",
        populate: [
          { path: "department", select: "name" },
          { path: "hospital", select: "name" },
        ],
      })
      .skip(skip)
      .limit(Number.parseInt(limit))
      .sort({ checkInTime: -1 })

    // Get total count
    const total = await Attendance.countDocuments(query)

    res.status(200).json({
      success: true,
      count: attendance.length,
      total,
      pagination: {
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
      data: attendance,
    })
  } catch (error) {
    console.error("Get attendance history error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Get attendance statistics
// @route   GET /api/attendance/stats
// @access  Private
exports.getAttendanceStats = async (req, res) => {
  try {
    const { departmentId, year, startDate, endDate } = req.query

    // Build date filter
    const dateFilter = {}
    if (startDate && endDate) {
      dateFilter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      }
    } else if (startDate) {
      dateFilter.date = { $gte: new Date(startDate) }
    } else if (endDate) {
      dateFilter.date = { $lte: new Date(endDate) }
    }

    // Build query based on user role
    let query = {}

    if (req.user.role === "student") {
      // Students can only see their own stats
      const sessions = await Session.find({
        department: req.user.department,
        year: req.user.year,
        ...dateFilter,
      }).select("_id")

      const sessionIds = sessions.map((session) => session._id)

      query = {
        student: req.user._id,
        session: { $in: sessionIds },
      }
    } else if (req.user.role === "faculty") {
      // Faculty can see stats for their department and sessions
      const sessions = await Session.find({
        faculty: req.user._id,
        ...dateFilter,
      }).select("_id")

      const sessionIds = sessions.map((session) => session._id)

      query = {
        session: { $in: sessionIds },
      }
    } else if (req.user.role === "admin") {
      // Admins can see all stats with optional filters
      const sessionQuery = { ...dateFilter }

      if (departmentId) {
        sessionQuery.department = departmentId
      }

      if (year) {
        sessionQuery.year = year
      }

      const sessions = await Session.find(sessionQuery).select("_id")
      const sessionIds = sessions.map((session) => session._id)

      query = {
        session: { $in: sessionIds },
      }
    }

    // Get attendance stats
    const stats = await Attendance.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ])

    // Format stats
    const formattedStats = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      total: 0,
    }

    stats.forEach((stat) => {
      formattedStats[stat._id] = stat.count
      formattedStats.total += stat.count
    })

    // Calculate percentages
    if (formattedStats.total > 0) {
      formattedStats.presentPercentage = (formattedStats.present / formattedStats.total) * 100
      formattedStats.absentPercentage = (formattedStats.absent / formattedStats.total) * 100
      formattedStats.latePercentage = (formattedStats.late / formattedStats.total) * 100
      formattedStats.excusedPercentage = (formattedStats.excused / formattedStats.total) * 100
    }

    res.status(200).json({
      success: true,
      data: formattedStats,
    })
  } catch (error) {
    console.error("Get attendance stats error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Generate attendance report
// @route   GET /api/attendance/report
// @access  Private/Faculty & Admin
exports.generateAttendanceReport = async (req, res) => {
  try {
    const { departmentId, year, startDate, endDate, format = "json" } = req.query

    // Validate access
    if (req.user.role !== "admin" && req.user.role !== "faculty") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to generate reports",
      })
    }

    // Build session query
    const sessionQuery = {}

    if (startDate && endDate) {
      sessionQuery.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      }
    } else if (startDate) {
      sessionQuery.date = { $gte: new Date(startDate) }
    } else if (endDate) {
      sessionQuery.date = { $lte: new Date(endDate) }
    }

    if (req.user.role === "faculty") {
      // Faculty can only see their own sessions
      sessionQuery.faculty = req.user._id
    } else if (departmentId) {
      // Admin can filter by department
      sessionQuery.department = departmentId
    }

    if (year) {
      sessionQuery.year = Number.parseInt(year)
    }

    // Get sessions
    const sessions = await Session.find(sessionQuery)
      .populate("faculty", "name")
      .populate("department", "name")
      .populate("hospital", "name")
      .sort({ date: 1, startTime: 1 })

    const sessionIds = sessions.map((session) => session._id)

    // Get attendance records
    const attendanceRecords = await Attendance.find({
      session: { $in: sessionIds },
    })
      .populate("student", "name studentId")
      .populate("session", "title date startTime endTime")

    // Group attendance by student
    const studentAttendance = {}

    attendanceRecords.forEach((record) => {
      const studentId = record.student._id.toString()

      if (!studentAttendance[studentId]) {
        studentAttendance[studentId] = {
          student: {
            id: studentId,
            name: record.student.name,
            studentId: record.student.studentId,
          },
          sessions: {},
          stats: {
            present: 0,
            absent: 0,
            late: 0,
            excused: 0,
            total: 0,
          },
        }
      }

      const sessionId = record.session._id.toString()
      studentAttendance[studentId].sessions[sessionId] = {
        sessionId,
        title: record.session.title,
        date: record.session.date,
        status: record.status,
        checkInTime: record.checkInTime,
        checkOutTime: record.checkOutTime,
      }

      studentAttendance[studentId].stats[record.status]++
      studentAttendance[studentId].stats.total++
    })

    // Add absent records for students who didn't mark attendance
    const students = await User.find({
      role: "student",
      department: departmentId || req.user.department,
      year: year ? Number.parseInt(year) : { $exists: true },
    }).select("_id name studentId")

    sessions.forEach((session) => {
      const sessionId = session._id.toString()

      students.forEach((student) => {
        const studentId = student._id.toString()

        // Initialize student record if not exists
        if (!studentAttendance[studentId]) {
          studentAttendance[studentId] = {
            student: {
              id: studentId,
              name: student.name,
              studentId: student.studentId,
            },
            sessions: {},
            stats: {
              present: 0,
              absent: 0,
              late: 0,
              excused: 0,
              total: 0,
            },
          }
        }

        // Add absent record if no attendance found
        if (!studentAttendance[studentId].sessions[sessionId]) {
          studentAttendance[studentId].sessions[sessionId] = {
            sessionId,
            title: session.title,
            date: session.date,
            status: "absent",
            checkInTime: null,
            checkOutTime: null,
          }

          studentAttendance[studentId].stats.absent++
          studentAttendance[studentId].stats.total++
        }
      })
    })

    // Calculate percentages
    Object.values(studentAttendance).forEach((record) => {
      if (record.stats.total > 0) {
        record.stats.presentPercentage = (record.stats.present / record.stats.total) * 100
        record.stats.absentPercentage = (record.stats.absent / record.stats.total) * 100
        record.stats.latePercentage = (record.stats.late / record.stats.total) * 100
        record.stats.excusedPercentage = (record.stats.excused / record.stats.total) * 100
      }
    })

    // Format response based on requested format
    if (format === "csv") {
      // Generate CSV report
      let csv = "Student ID,Student Name,Present,Late,Absent,Excused,Attendance % \n"

      Object.values(studentAttendance).forEach((record) => {
        const attendancePercentage = ((record.stats.present + record.stats.late) / record.stats.total) * 100

        csv += `${record.student.studentId},${record.student.name},${record.stats.present},${record.stats.late},${record.stats.absent},${record.stats.excused},${attendancePercentage.toFixed(2)}%
`
      })

      res.setHeader("Content-Type", "text/csv")
      res.setHeader("Content-Disposition", "attachment; filename=attendance_report.csv")
      return res.status(200).send(csv)
    }

    // Default JSON response
    res.status(200).json({
      success: true,
      data: {
        sessions,
        students: Object.values(studentAttendance),
      },
    })
  } catch (error) {
    console.error("Generate attendance report error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

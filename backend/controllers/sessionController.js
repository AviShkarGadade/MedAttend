const Session = require("../models/Session")
const User = require("../models/User")
const Department = require("../models/Department")
const Hospital = require("../models/Hospital")
const Notification = require("../models/Notification")
const crypto = require("crypto")
const QRCode = require("qrcode")
const { calculateDistance } = require("../utils/geolocation")

// @desc    Create session
// @route   POST /api/sessions
// @access  Private/Faculty
exports.createSession = async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      startTime,
      endTime,
      department,
      hospital,
      location,
      coordinates,
      radius,
      enableGeolocation,
      enableQRCode,
      year,
    } = req.body

    // Validate faculty
    if (req.user.role !== "faculty") {
      return res.status(403).json({
        success: false,
        message: "Only faculty can create sessions",
      })
    }

    // Find department
    const departmentDoc = await Department.findOne({ name: department })
    if (!departmentDoc) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      })
    }

    // Validate faculty department
    if (req.user.department.toString() !== departmentDoc._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Faculty can only create sessions for their own department",
      })
    }

    // Find hospital
    const hospitalDoc = await Hospital.findOne({ name: hospital })
    if (!hospitalDoc) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      })
    }

    // Generate QR code secret if enabled
    let qrCodeSecret = null
    let qrCodeExpiry = null

    if (enableQRCode) {
      qrCodeSecret = crypto.randomBytes(32).toString("hex")
      // Set expiry to 24 hours from now
      qrCodeExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)
    }

    // Create session
    const session = await Session.create({
      title,
      description,
      date,
      startTime,
      endTime,
      faculty: req.user._id,
      department: departmentDoc._id,
      hospital: hospitalDoc._id,
      location,
      coordinates,
      radius: radius || 100,
      enableGeolocation,
      enableQRCode,
      qrCodeSecret,
      qrCodeExpiry,
      year,
      status: "upcoming",
    })

    // Find students in the department and year
    const students = await User.find({
      role: "student",
      department: departmentDoc._id,
      year,
    })

    // Create notifications for students
    const notifications = students.map((student) => ({
      recipient: student._id,
      title: "New Session Created",
      message: `A new session "${title}" has been created for ${new Date(date).toLocaleDateString()} at ${startTime}.`,
      type: "session",
      relatedTo: {
        model: "Session",
        id: session._id,
      },
    }))

    await Notification.insertMany(notifications)

    res.status(201).json({
      success: true,
      data: session,
    })
  } catch (error) {
    console.error("Create session error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Get all sessions
// @route   GET /api/sessions
// @access  Private
exports.getSessions = async (req, res) => {
  try {
    const { status, department, date, search, page = 1, limit = 10 } = req.query

    // Build query
    const query = {}

    // Role-based filtering
    if (req.user.role === "faculty") {
      // Faculty can only see their own sessions
      query.faculty = req.user._id
    } else if (req.user.role === "student") {
      // Students can only see sessions for their department and year
      query.department = req.user.department
      query.year = req.user.year
    }

    if (status) {
      query.status = status
    }

    if (department && req.user.role === "admin") {
      const departmentDoc = await Department.findOne({ name: department })
      if (departmentDoc) {
        query.department = departmentDoc._id
      }
    }

    if (date) {
      // Filter by specific date
      const startDate = new Date(date)
      startDate.setHours(0, 0, 0, 0)

      const endDate = new Date(date)
      endDate.setHours(23, 59, 59, 999)

      query.date = { $gte: startDate, $lte: endDate }
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ]
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Execute query
    const sessions = await Session.find(query)
      .populate("faculty", "name")
      .populate("department", "name")
      .populate("hospital", "name")
      .skip(skip)
      .limit(Number.parseInt(limit))
      .sort({ date: 1, startTime: 1 })

    // Get total count
    const total = await Session.countDocuments(query)

    res.status(200).json({
      success: true,
      count: sessions.length,
      total,
      pagination: {
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
      data: sessions,
    })
  } catch (error) {
    console.error("Get sessions error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Get session by ID
// @route   GET /api/sessions/:id
// @access  Private
exports.getSessionById = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate("faculty", "name")
      .populate("department", "name")
      .populate("hospital", "name")

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      })
    }

    // Check authorization
    if (req.user.role === "faculty" && session.faculty._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this session",
      })
    }

    if (
      req.user.role === "student" &&
      (session.department._id.toString() !== req.user.department.toString() || session.year !== req.user.year)
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this session",
      })
    }

    res.status(200).json({
      success: true,
      data: session,
    })
  } catch (error) {
    console.error("Get session by ID error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Update session
// @route   PUT /api/sessions/:id
// @access  Private/Faculty
exports.updateSession = async (req, res) => {
  try {
    let session = await Session.findById(req.params.id)

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      })
    }

    // Check authorization
    if (req.user.role === "faculty" && session.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this session",
      })
    }

    // Only allow updates to upcoming sessions
    if (session.status !== "upcoming" && req.body.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Only upcoming sessions can be updated",
      })
    }

    // Update session
    session = await Session.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })

    // If status changed to active, notify students
    if (req.body.status === "active" && session.status === "active") {
      // Find students in the department and year
      const students = await User.find({
        role: "student",
        department: session.department,
        year: session.year,
      })

      // Create notifications for students
      const notifications = students.map((student) => ({
        recipient: student._id,
        title: "Session Started",
        message: `The session "${session.title}" has started. Please mark your attendance.`,
        type: "session",
        relatedTo: {
          model: "Session",
          id: session._id,
        },
      }))

      await Notification.insertMany(notifications)
    }

    res.status(200).json({
      success: true,
      data: session,
    })
  } catch (error) {
    console.error("Update session error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Delete session
// @route   DELETE /api/sessions/:id
// @access  Private/Faculty
exports.deleteSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      })
    }

    // Check authorization
    if (req.user.role === "faculty" && session.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this session",
      })
    }

    // Only allow deletion of upcoming sessions
    if (session.status !== "upcoming") {
      return res.status(400).json({
        success: false,
        message: "Only upcoming sessions can be deleted",
      })
    }

    await session.remove()

    res.status(200).json({
      success: true,
      message: "Session deleted successfully",
    })
  } catch (error) {
    console.error("Delete session error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Generate QR code for session
// @route   GET /api/sessions/:id/qrcode
// @access  Private/Faculty
exports.generateQRCode = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      })
    }

    // Check authorization
    if (req.user.role === "faculty" && session.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to generate QR code for this session",
      })
    }

    // Check if QR code is enabled
    if (!session.enableQRCode) {
      return res.status(400).json({
        success: false,
        message: "QR code is not enabled for this session",
      })
    }

    // Generate new QR code secret
    const qrCodeSecret = crypto.randomBytes(32).toString("hex")
    // Set expiry to 10 minutes from now
    const qrCodeExpiry = new Date(Date.now() + 10 * 60 * 1000)

    // Update session with new QR code secret
    session.qrCodeSecret = qrCodeSecret
    session.qrCodeExpiry = qrCodeExpiry
    await session.save()

    // Generate QR code
    const payload = {
      sessionId: session._id.toString(),
      secret: qrCodeSecret,
      expiry: qrCodeExpiry.toISOString(),
    }

    const qrCodeData = await QRCode.toDataURL(JSON.stringify(payload))

    res.status(200).json({
      success: true,
      data: {
        qrCode: qrCodeData,
        expiry: qrCodeExpiry,
      },
    })
  } catch (error) {
    console.error("Generate QR code error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Mark session as completed
// @route   PUT /api/sessions/:id/complete
// @access  Private/Faculty
exports.completeSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      })
    }

    // Check authorization
    if (req.user.role === "faculty" && session.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to complete this session",
      })
    }

    // Only allow active sessions to be completed
    if (session.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Only active sessions can be marked as completed",
      })
    }

    // Update session status
    session.status = "completed"
    await session.save()

    res.status(200).json({
      success: true,
      data: session,
      message: "Session marked as completed",
    })
  } catch (error) {
    console.error("Complete session error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}


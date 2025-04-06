const { auth } = require("../config/firebase")
const User = require("../models/User")
const Department = require("../models/Department")
const Hospital = require("../models/Hospital")
const Notification = require("../models/Notification")

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { token, name, email, role, department, hospital, studentId, facultyId, year } = req.body

    // Verify Firebase token
    const decodedToken = await auth.verifyIdToken(token)
    const firebaseUid = decodedToken.uid

    // Check if user already exists
    const existingUser = await User.findOne({ firebaseUid })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
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

    // Create user object
    const userData = {
      firebaseUid,
      name,
      email,
      role,
      department: departmentDoc._id,
      isApproved: role !== "faculty", // Students and admins are auto-approved
    }

    // Add role-specific fields
    if (role === "student") {
      userData.studentId = studentId
      userData.year = year
    } else if (role === "faculty") {
      userData.facultyId = facultyId

      // Find hospital
      const hospitalDoc = await Hospital.findOne({ name: hospital })
      if (!hospitalDoc) {
        return res.status(404).json({
          success: false,
          message: "Hospital not found",
        })
      }

      userData.hospital = hospitalDoc._id
    }

    // Create user
    const user = await User.create(userData)

    // Create notification for admin if faculty registration
    if (role === "faculty") {
      // Find admin users
      const admins = await User.find({ role: "admin" })

      // Create notifications for each admin
      const notifications = admins.map((admin) => ({
        recipient: admin._id,
        title: "New Faculty Registration",
        message: `${name} has registered as faculty and is awaiting approval.`,
        type: "approval",
        relatedTo: {
          model: "User",
          id: user._id,
        },
      }))

      await Notification.insertMany(notifications)
    }

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      isApproved: user.isApproved,
      role: user.role,
    })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({
      success: false,
      message: "Server error during registration",
      error: error.message,
    })
  }
}

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { token } = req.body

    // Verify Firebase token
    const decodedToken = await auth.verifyIdToken(token)
    const firebaseUid = decodedToken.uid

    // Find user
    const user = await User.findOne({ firebaseUid }).populate("department", "name").populate("hospital", "name")

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Check if faculty is approved
    if (user.role === "faculty" && !user.isApproved) {
      return res.status(403).json({
        success: false,
        message: "Faculty account pending approval",
        role: "pending",
      })
    }

    // Update last login
    user.lastLogin = new Date()
    await user.save()

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department ? user.department.name : null,
        hospital: user.hospital ? user.hospital.name : null,
        studentId: user.studentId,
        facultyId: user.facultyId,
        year: user.year,
        isApproved: user.isApproved,
        profileImage: user.profileImage,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({
      success: false,
      message: "Server error during login",
      error: error.message,
    })
  }
}

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("department", "name").populate("hospital", "name")

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department ? user.department.name : null,
        hospital: user.hospital ? user.hospital.name : null,
        studentId: user.studentId,
        facultyId: user.facultyId,
        year: user.year,
        isApproved: user.isApproved,
        profileImage: user.profileImage,
        lastLogin: user.lastLogin,
      },
    })
  } catch (error) {
    console.error("Get me error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}


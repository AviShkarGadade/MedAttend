const express = require("express")
const router = express.Router()
const { protect } = require("../middleware/auth")
const User = require("../models/User")
const { admin, auth } = require("../config/firebase")

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post("/register", async (req, res) => {
  try {
    const { token, name, email, role, department, hospital, studentId, facultyId, year } = req.body

    // Verify Firebase token
    const decodedToken = await auth.verifyIdToken(token)
    const uid = decodedToken.uid

    // Check if user already exists
    const existingUser = await User.findOne({ firebaseUid: uid })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      })
    }

    // Create new user in MongoDB
    const newUser = {
      firebaseUid: uid,
      name,
      email,
      role,
      isApproved: role === "student" || role === "admin", // Students and admins are auto-approved
      createdAt: new Date(),
    }

    // Add role-specific fields
    if (role === "student") {
      newUser.studentId = studentId
      newUser.department = department
      newUser.year = year
    } else if (role === "faculty") {
      newUser.facultyId = facultyId
      newUser.department = department
      newUser.hospital = hospital
    }

    const user = await User.create(newUser)

    // If faculty role, create a pending approval record
    if (role === "faculty") {
      await User.findByIdAndUpdate(user._id, { isApproved: false })
    }

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      isApproved: newUser.isApproved,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({
      success: false,
      message: error.message || "Registration failed",
    })
  }
})

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post("/login", async (req, res) => {
  try {
    const { token } = req.body

    // Verify Firebase token
    const decodedToken = await auth.verifyIdToken(token)
    const uid = decodedToken.uid

    // Find user in database
    const user = await User.findOne({ firebaseUid: uid }).populate("department", "name").populate("hospital", "name")

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Check if faculty account is approved
    if (user.role === "faculty" && !user.isApproved) {
      return res.status(403).json({
        success: false,
        message: "Faculty account pending approval",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: "pending",
          isApproved: false,
        },
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
      message: error.message || "Login failed",
    })
  }
})

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get("/me", protect, async (req, res) => {
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
    console.error("Get current user error:", error)
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get user data",
    })
  }
})

// @desc    Verify token and get user data
// @route   POST /api/auth/me
// @access  Public
router.post("/me", async (req, res) => {
  try {
    const { token } = req.body

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token is required",
      })
    }

    // Verify Firebase token
    const decodedToken = await auth.verifyIdToken(token)
    const uid = decodedToken.uid

    // Find user in database
    const user = await User.findOne({ firebaseUid: uid }).populate("department", "name").populate("hospital", "name")

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Check if faculty account is approved
    if (user.role === "faculty" && !user.isApproved) {
      return res.status(403).json({
        success: false,
        message: "Faculty account pending approval",
        role: "pending",
      })
    }

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
    console.error("Verify token error:", error)
    res.status(401).json({
      success: false,
      message: error.message || "Invalid token",
    })
  }
})

module.exports = router


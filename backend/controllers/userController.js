const User = require("../models/User")
const Department = require("../models/Department")
const Hospital = require("../models/Hospital")
const Notification = require("../models/Notification")
const { auth } = require("../config/firebase")

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const { role, department, year, search, page = 1, limit = 10 } = req.query

    // Build query
    const query = {}

    if (role) {
      query.role = role
    }

    if (department) {
      const departmentDoc = await Department.findOne({ name: department })
      if (departmentDoc) {
        query.department = departmentDoc._id
      }
    }

    if (year && role === "student") {
      query.year = year
    }

    if (search) {
      query.$or = [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }]

      // Add role-specific search
      if (role === "student") {
        query.$or.push({ studentId: { $regex: search, $options: "i" } })
      } else if (role === "faculty") {
        query.$or.push({ facultyId: { $regex: search, $options: "i" } })
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Execute query
    const users = await User.find(query)
      .populate("department", "name")
      .populate("hospital", "name")
      .skip(skip)
      .limit(Number.parseInt(limit))
      .sort({ createdAt: -1 })

    // Get total count
    const total = await User.countDocuments(query)

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      pagination: {
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
      data: users,
    })
  } catch (error) {
    console.error("Get users error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate("department", "name").populate("hospital", "name")

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    res.status(200).json({
      success: true,
      data: user,
    })
  } catch (error) {
    console.error("Get user by ID error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Create user
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, department, hospital, studentId, facultyId, year } = req.body

    // Create user in Firebase
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
    })

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
      firebaseUid: userRecord.uid,
      name,
      email,
      role,
      department: departmentDoc._id,
      isApproved: true, // Admin-created users are auto-approved
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

    // Create user in database
    const user = await User.create(userData)

    res.status(201).json({
      success: true,
      data: user,
    })
  } catch (error) {
    console.error("Create user error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const { name, email, role, department, hospital, studentId, facultyId, year, isApproved } = req.body

    // Find user
    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Update user object
    if (name) user.name = name
    if (email) user.email = email
    if (role) user.role = role

    if (department) {
      const departmentDoc = await Department.findOne({ name: department })
      if (departmentDoc) {
        user.department = departmentDoc._id
      }
    }

    // Update role-specific fields
    if (role === "student" || user.role === "student") {
      if (studentId) user.studentId = studentId
      if (year) user.year = year
    } else if (role === "faculty" || user.role === "faculty") {
      if (facultyId) user.facultyId = facultyId

      if (hospital) {
        const hospitalDoc = await Hospital.findOne({ name: hospital })
        if (hospitalDoc) {
          user.hospital = hospitalDoc._id
        }
      }

      // Handle faculty approval
      if (isApproved !== undefined && user.isApproved !== isApproved) {
        user.isApproved = isApproved

        // Create notification for faculty if approved
        if (isApproved) {
          await Notification.create({
            recipient: user._id,
            title: "Account Approved",
            message: "Your faculty account has been approved. You can now access the system.",
            type: "approval",
          })
        }
      }
    }

    // Save updated user
    await user.save()

    // Update Firebase user if email changed
    if (email && email !== user.email) {
      await auth.updateUser(user.firebaseUid, {
        email,
        displayName: name || user.name,
      })
    } else if (name && name !== user.name) {
      await auth.updateUser(user.firebaseUid, {
        displayName: name,
      })
    }

    res.status(200).json({
      success: true,
      data: user,
    })
  } catch (error) {
    console.error("Update user error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Delete user from Firebase
    await auth.deleteUser(user.firebaseUid)

    // Delete user from database
    await user.remove()

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    })
  } catch (error) {
    console.error("Delete user error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Approve faculty
// @route   PUT /api/users/:id/approve
// @access  Private/Admin
exports.approveFaculty = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    if (user.role !== "faculty") {
      return res.status(400).json({
        success: false,
        message: "User is not a faculty member",
      })
    }

    if (user.isApproved) {
      return res.status(400).json({
        success: false,
        message: "Faculty is already approved",
      })
    }

    // Approve faculty
    user.isApproved = true
    await user.save()

    // Create notification for faculty
    await Notification.create({
      recipient: user._id,
      title: "Account Approved",
      message: "Your faculty account has been approved. You can now access the system.",
      type: "approval",
    })

    res.status(200).json({
      success: true,
      data: user,
      message: "Faculty approved successfully",
    })
  } catch (error) {
    console.error("Approve faculty error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

// @desc    Reject faculty
// @route   PUT /api/users/:id/reject
// @access  Private/Admin
exports.rejectFaculty = async (req, res) => {
  try {
    const { reason } = req.body
    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    if (user.role !== "faculty") {
      return res.status(400).json({
        success: false,
        message: "User is not a faculty member",
      })
    }

    // Create notification for faculty
    await Notification.create({
      recipient: user._id,
      title: "Account Rejected",
      message: `Your faculty account application has been rejected. Reason: ${reason || "Not specified"}`,
      type: "approval",
    })

    // Delete user from Firebase
    await auth.deleteUser(user.firebaseUid)

    // Delete user from database
    await user.remove()

    res.status(200).json({
      success: true,
      message: "Faculty rejected successfully",
    })
  } catch (error) {
    console.error("Reject faculty error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}


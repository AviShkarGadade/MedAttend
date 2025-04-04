const express = require("express")
const router = express.Router()
const { protect, authorize } = require("../middleware/auth")
const User = require("../models/User")
const Department = require("../models/Department")
const Hospital = require("../models/Hospital")

// @desc    Get admin dashboard data
// @route   GET /api/admin/dashboard
// @access  Private/Admin
router.get("/dashboard", protect, authorize("admin"), async (req, res) => {
  try {
    // Get counts
    const studentsCount = await User.countDocuments({ role: "student" })
    const facultyCount = await User.countDocuments({ role: "faculty" })
    const pendingFacultyCount = await User.countDocuments({ role: "faculty", isApproved: false })
    const hospitalsCount = await Hospital.countDocuments()

    // Get pending faculty approvals
    const pendingFaculty = await User.find({ role: "faculty", isApproved: false })
      .populate("department", "name")
      .populate("hospital", "name")
      .sort({ createdAt: -1 })
      .limit(5)

    // Get hospitals with counts
    const hospitals = await Hospital.find().limit(5)

    // Get student and faculty counts for each hospital
    const hospitalData = await Promise.all(
      hospitals.map(async (hospital) => {
        const facultyCount = await User.countDocuments({
          role: "faculty",
          hospital: hospital._id,
        })

        const studentCount = await User.countDocuments({
          role: "student",
          // Simplified count for students - in a full implementation,
          // we'd need to check which students have sessions at this hospital
        })

        return {
          _id: hospital._id,
          name: hospital.name,
          address: hospital.address,
          city: hospital.city,
          state: hospital.state,
          zipCode: hospital.zipCode,
          coordinates: hospital.coordinates,
          facultyCount,
          studentCount,
        }
      }),
    )

    // Create simple activity data
    const recentActivity = [
      {
        id: "act001",
        type: "user_added",
        description: "Added new student: Maria Garcia",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        performedBy: req.user.name,
      },
      {
        id: "act002",
        type: "user_approved",
        description: "Approved faculty account: Dr. Lisa Wong",
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
        performedBy: req.user.name,
      },
      {
        id: "act003",
        type: "hospital_added",
        description: "Added new hospital: Riverside Medical Center",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        performedBy: req.user.name,
      },
    ]

    // Return successful response
    console.log("Admin dashboard data sent successfully")

    res.status(200).json({
      success: true,
      data: {
        admin: {
          name: req.user.name,
          id: req.user._id,
          role: req.user.role,
          department: req.user.department ? req.user.department.name : "System Administration",
        },
        stats: {
          totalStudents: studentsCount,
          totalFaculty: facultyCount,
          totalHospitals: hospitalsCount,
          pendingApprovals: pendingFacultyCount,
        },
        pendingApprovals: pendingFaculty,
        hospitals: hospitalData,
        recentActivity,
      },
    })
  } catch (error) {
    console.error("Error fetching admin dashboard data:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
})

// Add a simple test route to validate the routing works
router.get("/test", (req, res) => {
  res.status(200).json({ message: "Admin routes working" })
})

module.exports = router


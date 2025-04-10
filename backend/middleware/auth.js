const { auth } = require("../config/firebase")
const User = require("../models/User")

// Middleware to verify Firebase token and attach user to request
exports.protect = async (req, res, next) => {
  let token

  // Check if token exists in headers
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1]

      // Verify token
      const decodedToken = await auth.verifyIdToken(token)

      // Get user from database
      const user = await User.findOne({ firebaseUid: decodedToken.uid })
        .select("-__v")
        .populate("department", "name")
        .populate("hospital", "name")

      if (!user) {
        console.log("User not found for firebaseUid:", decodedToken.uid)
        return res.status(404).json({
          success: false,
          message: "User not found",
        })
      }

      // Check if faculty is approved
      if (user.role === "faculty" && !user.isApproved) {
        console.log("Faculty account pending approval:", user.email)
        return res.status(403).json({
          success: false,
          message: "Faculty account pending approval",
        })
      }

      // Attach user to request
      req.user = user

      // Update last login
      await User.findByIdAndUpdate(user._id, { lastLogin: new Date() })

      next()
    } catch (error) {
      console.error("Auth middleware error:", error)

      // Different error messages based on error type
      if (error.code === "auth/id-token-expired") {
        return res.status(401).json({
          success: false,
          message: "Your session has expired, please login again",
        })
      } else if (error.code === "auth/argument-error") {
        return res.status(401).json({
          success: false,
          message: "Invalid token format",
        })
      } else {
        return res.status(401).json({
          success: false,
          message: "Not authorized, invalid token",
        })
      }
    }
  } else {
    console.log("No token provided in request")
    return res.status(401).json({
      success: false,
      message: "Not authorized, no token provided",
    })
  }
}

// Middleware to restrict access based on roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      console.log(`Unauthorized role access attempt: ${req.user.role} tried to access ${req.originalUrl}`)
      return res.status(403).json({
        success: false,
        message: `Role ${req.user.role} is not authorized to access this resource`,
      })
    }
    next()
  }
}

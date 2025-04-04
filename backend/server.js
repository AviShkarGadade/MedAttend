const express = require("express")
const cors = require("cors")
const morgan = require("morgan")
const path = require("path")
const dotenv = require("dotenv")
const connectDB = require("./config/db")

// Load environment variables
dotenv.config()

// Connect to database
connectDB()

// Initialize Express
const app = express()

// Middleware
app.use(cors())
app.use(express.json())
app.use(morgan("dev"))

// Add a simple test route at the root level
app.get("/api/test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API server is running",
    timestamp: new Date().toISOString(),
  })
})

// API Routes
console.log("Registering API routes...")
app.use("/api/auth", require("./routes/authRoutes"))
app.use("/api/users", require("./routes/userRoutes"))
app.use("/api/sessions", require("./routes/sessionRoutes"))
app.use("/api/attendance", require("./routes/attendanceRoutes"))
app.use("/api/departments", require("./routes/departmentRoutes"))
app.use("/api/hospitals", require("./routes/hospitalRoutes"))
app.use("/api/notifications", require("./routes/notificationRoutes"))
app.use("/api/student", require("./routes/studentRoutes"))
console.log("Registering admin routes at /api/admin")
app.use("/api/admin", require(path.join(__dirname, "routes", "adminRoutes")))
console.log("Registering faculty routes at /api/faculty")
app.use("/api/faculty", require(path.join(__dirname, "routes", "facultyRoutes")))

// Add debug routes
console.log("Registering debug routes at /api/debug")
app.use("/api/debug", require("./routes/debugRoutes"))

// Serve static assets in production
if (process.env.NODE_ENV === "production") {
  // Set static folder
  app.use(express.static(path.join(__dirname, "../frontend/build")))

  // Any route that is not an API route will be redirected to index.html
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../frontend/build", "index.html"))
  })
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err.stack)
  res.status(500).json({
    success: false,
    message: "Server Error",
    error: process.env.NODE_ENV === "production" ? null : err.message,
  })
})

// Start server
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Test API at: http://localhost:${PORT}/api/test`)
  console.log(`Debug routes at: http://localhost:${PORT}/api/debug/routes`)
})


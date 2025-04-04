const mongoose = require("mongoose")

const AttendanceSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["present", "absent", "late", "excused"],
      required: true,
    },
    checkInTime: {
      type: Date,
    },
    checkOutTime: {
      type: Date,
    },
    verificationMethod: {
      type: String,
      enum: ["qrcode", "geolocation", "manual"],
      required: true,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    location: {
      latitude: Number,
      longitude: Number,
    },
    notes: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

// Create indexes for faster queries
AttendanceSchema.index({ session: 1, student: 1 }, { unique: true })
AttendanceSchema.index({ student: 1, status: 1 })

const Attendance = mongoose.model("Attendance", AttendanceSchema)

module.exports = Attendance


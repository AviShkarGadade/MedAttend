const mongoose = require("mongoose")

const SessionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    coordinates: {
      latitude: {
        type: Number,
        required: true,
      },
      longitude: {
        type: Number,
        required: true,
      },
    },
    radius: {
      type: Number,
      default: 100, 
    },
    enableGeolocation: {
      type: Boolean,
      default: true,
    },
    enableQRCode: {
      type: Boolean,
      default: true,
    },
    qrCodeSecret: {
      type: String,
    },
    qrCodeExpiry: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["upcoming", "active", "completed", "cancelled"],
      default: "upcoming",
    },
    year: {
      type: Number,
      required: true,
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

SessionSchema.index({ faculty: 1, date: 1 })
SessionSchema.index({ department: 1, date: 1 })
SessionSchema.index({ status: 1 })

const Session = mongoose.model("Session", SessionSchema)

module.exports = Session


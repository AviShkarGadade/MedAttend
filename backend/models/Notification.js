const mongoose = require("mongoose")

const NotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["attendance", "session", "announcement", "approval", "system"],
      required: true,
    },
    relatedTo: {
      model: {
        type: String,
        enum: ["Session", "Attendance", "User"],
      },
      id: {
        type: mongoose.Schema.Types.ObjectId,
      },
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

// Create indexes for faster queries
NotificationSchema.index({ recipient: 1, isRead: 1 })
NotificationSchema.index({ recipient: 1, createdAt: -1 })

const Notification = mongoose.model("Notification", NotificationSchema)

module.exports = Notification


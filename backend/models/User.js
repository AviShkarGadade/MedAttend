const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const UserSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      enum: ["admin", "faculty", "student"],
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
      required: function () {
        return this.role === "faculty"
      },
    },
    studentId: {
      type: String,
      required: function () {
        return this.role === "student"
      },
      unique: function () {
        return this.role === "student"
      },
    },
    facultyId: {
      type: String,
      required: function () {
        return this.role === "faculty"
      },
      unique: function () {
        return this.role === "faculty"
      },
    },
    year: {
      type: Number,
      required: function () {
        return this.role === "student"
      },
      min: 1,
      max: 7,
    },
    isApproved: {
      type: Boolean,
      default: function () {
        return this.role !== "faculty" // Students and admins are auto-approved
      },
    },
    profileImage: {
      type: String,
    },
    lastLogin: {
      type: Date,
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

// Create index for faster queries
UserSchema.index({ role: 1, department: 1 })
UserSchema.index({ firebaseUid: 1 })

const User = mongoose.model("User", UserSchema)

module.exports = User


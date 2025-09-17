import { type NextRequest, NextResponse } from "next/server"
import { initializeApp, cert, getApps } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  })
}

export async function POST(request: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const sessionId = params.sessionId

    // Get token from authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]

    // Verify the Firebase ID token
    const decodedToken = await getAuth().verifyIdToken(token)
    const uid = decodedToken.uid

    // Connect to MongoDB
    const { db } = await connectToDatabase()

    // Check if user exists
    const user = await db.collection("users").findOne({ firebaseUid: uid })
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Get session
    let sessionObjectId
    try {
      sessionObjectId = new ObjectId(sessionId)
    } catch (error) {
      return NextResponse.json({ message: "Invalid session ID format" }, { status: 400 })
    }

    const session = await db.collection("sessions").findOne({ _id: sessionObjectId })
    if (!session) {
      return NextResponse.json({ message: "Session not found" }, { status: 404 })
    }

    // Check authorization - only faculty who created the session or admin can mark attendance
    if (user.role === "faculty" && session.faculty.toString() !== user._id.toString()) {
      return NextResponse.json({ message: "Not authorized to mark attendance for this session" }, { status: 403 })
    }

    if (user.role !== "faculty" && user.role !== "admin") {
      return NextResponse.json({ message: "Only faculty or admin can mark attendance" }, { status: 403 })
    }

    // Prevent marking attendance if session already completed/locked
    if (session.status === "completed" || session.attendanceLocked) {
      return NextResponse.json({ message: "Attendance is locked for this session" }, { status: 409 })
    }

    // Get attendance data
    const { attendanceRecords } = await request.json()

    if (!attendanceRecords || !Array.isArray(attendanceRecords)) {
      return NextResponse.json({ message: "Invalid attendance records" }, { status: 400 })
    }

    // Process each attendance record
    const results = await Promise.all(
      attendanceRecords.map(async (record) => {
        try {
          const { studentId, status, notes } = record

          // Validate student
          let studentObjectId
          try {
            studentObjectId = new ObjectId(studentId)
          } catch (error) {
            return {
              studentId,
              success: false,
              message: "Invalid student ID format",
            }
          }

          const student = await db.collection("users").findOne({
            _id: studentObjectId,
            role: "student",
          })

          if (!student) {
            return {
              studentId,
              success: false,
              message: "Student not found",
            }
          }

          // Check if attendance already exists
          const attendance = await db.collection("attendance").findOne({
            session: sessionObjectId,
            student: studentObjectId,
          })

          if (attendance) {
            // Update existing attendance
            await db.collection("attendance").updateOne(
              { _id: attendance._id },
              {
                $set: {
                  status,
                  notes,
                  verifiedBy: user._id,
                  verificationMethod: "manual",
                  updatedAt: new Date(),
                },
              },
            )

            return {
              studentId,
              success: true,
              message: "Attendance updated successfully",
            }
          } else {
            // Create new attendance record
            const newAttendance = {
              session: sessionObjectId,
              student: studentObjectId,
              status,
              notes,
              verifiedBy: user._id,
              verificationMethod: "manual",
              checkInTime: status === "present" || status === "late" ? new Date() : null,
              createdAt: new Date(),
              updatedAt: new Date(),
            }

            const result = await db.collection("attendance").insertOne(newAttendance)

            return {
              studentId,
              success: true,
              message: "Attendance marked successfully",
            }
          }
        } catch (error: any) {
          return {
            studentId: record.studentId,
            success: false,
            message: error.message || "Failed to process attendance",
          }
        }
      }),
    )

    // Mark session as completed and lock further edits
    await db.collection("sessions").updateOne(
      { _id: sessionObjectId },
      { $set: { status: "completed", attendanceLocked: true, updatedAt: new Date() } },
    )

    return NextResponse.json({
      success: true,
      data: results,
      message: "Bulk attendance processed and session marked as completed",
    })
  } catch (error: any) {
    console.error("Bulk mark attendance error:", error)
    return NextResponse.json({ message: error.message || "Server error" }, { status: 500 })
  }
}

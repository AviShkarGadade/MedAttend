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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionId = params?.id

    if (!sessionId) {
      return NextResponse.json({ message: "Session ID is required" }, { status: 400 })
    }

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

    // Validate sessionId format
    let sessionObjectId
    try {
      sessionObjectId = new ObjectId(sessionId)
    } catch (error) {
      // If not a valid ObjectId, try to find by other identifiers
      const session = await db.collection("sessions").findOne({
        $or: [{ id: sessionId }, { externalId: sessionId }],
      })

      if (!session) {
        return NextResponse.json(
          { message: "Invalid session ID format and no matching session found" },
          { status: 400 },
        )
      }

      sessionObjectId = session._id
    }

    // Get session
    const session = await db.collection("sessions").findOne({ _id: sessionObjectId })
    if (!session) {
      return NextResponse.json({ message: "Session not found" }, { status: 404 })
    }

    // Check authorization based on role
    if (user.role === "faculty" && session.faculty.toString() !== user._id.toString()) {
      return NextResponse.json({ message: "Not authorized to access this session's attendance" }, { status: 403 })
    }

    // Get attendance records for this session
    const attendanceRecords = await db.collection("attendance").find({ session: sessionObjectId }).toArray()

    // Get all students in the department and year
    const students = await db
      .collection("users")
      .find({
        role: "student",
        department: session.department,
        year: session.year,
      })
      .toArray()

    // Create a map of student IDs to attendance records
    const attendanceMap = attendanceRecords.reduce((map, record) => {
      map[record.student.toString()] = record
      return map
    }, {})

    // Create a complete attendance list including absent students
    const completeAttendance = await Promise.all(
      students.map(async (student) => {
        const record = attendanceMap[student._id.toString()]

        if (record) {
          // Populate student info for existing records
          return {
            ...record,
            student: {
              _id: student._id,
              name: student.name,
              studentId: student.studentId,
              email: student.email,
            },
          }
        } else {
          // Create a placeholder for students without attendance records
          return {
            _id: null,
            session: sessionObjectId,
            student: {
              _id: student._id,
              name: student.name,
              studentId: student.studentId,
              email: student.email,
            },
            status: "absent",
            checkInTime: null,
            verificationMethod: null,
          }
        }
      }),
    )

    return NextResponse.json({
      success: true,
      data: completeAttendance,
    })
  } catch (error: any) {
    console.error("Get session attendance error:", error)
    return NextResponse.json({ message: error.message || "Server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionId = params?.id

    if (!sessionId) {
      return NextResponse.json({ message: "Session ID is required" }, { status: 400 })
    }

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

    // Check if user exists and is faculty
    const user = await db.collection("users").findOne({ firebaseUid: uid })
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    if (user.role !== "faculty" && user.role !== "admin") {
      return NextResponse.json({ message: "Only faculty or admin can mark attendance" }, { status: 403 })
    }

    // Validate sessionId format
    let sessionObjectId
    try {
      sessionObjectId = new ObjectId(sessionId)
    } catch (error) {
      return NextResponse.json({ message: "Invalid session ID format" }, { status: 400 })
    }

    // Get session
    const session = await db.collection("sessions").findOne({ _id: sessionObjectId })
    if (!session) {
      return NextResponse.json({ message: "Session not found" }, { status: 404 })
    }

    // Check authorization - only faculty who created the session or admin can mark attendance
    if (user.role === "faculty" && session.faculty.toString() !== user._id.toString()) {
      return NextResponse.json({ message: "Not authorized to mark attendance for this session" }, { status: 403 })
    }

    // Get attendance data
    const { studentIds, status, notes } = await request.json()

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ message: "Student IDs are required" }, { status: 400 })
    }

    // Process each student
    const results = await Promise.all(
      studentIds.map(async (studentId) => {
        try {
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

            await db.collection("attendance").insertOne(newAttendance)

            return {
              studentId,
              success: true,
              message: "Attendance marked successfully",
            }
          }
        } catch (error: any) {
          return {
            studentId,
            success: false,
            message: error.message || "Failed to process attendance",
          }
        }
      }),
    )

    return NextResponse.json({
      success: true,
      data: results,
      message: "Attendance processed",
    })
  } catch (error: any) {
    console.error("Mark attendance error:", error)
    return NextResponse.json({ message: error.message || "Server error" }, { status: 500 })
  }
}

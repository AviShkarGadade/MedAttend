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
    const sessionId = params.id

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
    const session = await db.collection("sessions").findOne({ _id: new ObjectId(sessionId) })
    if (!session) {
      return NextResponse.json({ message: "Session not found" }, { status: 404 })
    }

    // Check authorization based on role
    if (user.role === "faculty" && session.faculty.toString() !== user._id.toString()) {
      return NextResponse.json({ message: "Not authorized to access this session's attendance" }, { status: 403 })
    }

    // Get attendance records for this session
    const attendanceRecords = await db
      .collection("attendance")
      .find({ session: new ObjectId(sessionId) })
      .toArray()

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
            session: new ObjectId(sessionId),
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


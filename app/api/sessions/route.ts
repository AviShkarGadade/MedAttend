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

export async function GET(request: NextRequest) {
  try {
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

    // Get query parameters
    const url = new URL(request.url)
    const status = url.searchParams.get("status")
    const department = url.searchParams.get("department")
    const date = url.searchParams.get("date")
    const limit = Number.parseInt(url.searchParams.get("limit") || "10")
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const skip = (page - 1) * limit

    // Build query based on user role and parameters
    const query: any = {}

    if (status) {
      // Handle multiple statuses (comma-separated)
      if (status.includes(",")) {
        query.status = { $in: status.split(",") }
      } else {
        query.status = status
      }
    }

    if (department) {
      try {
        query.department = new ObjectId(department)
      } catch (error) {
        console.error("Invalid department ObjectId:", department)
        query.department = department // Use as is if not a valid ObjectId
      }
    }

    if (date) {
      // Create date range for the specified date (entire day)
      // Convert to local timezone to ensure correct date filtering
      const startDate = new Date(date)
      startDate.setHours(0, 0, 0, 0)

      const endDate = new Date(date)
      endDate.setHours(23, 59, 59, 999)

      query.date = { $gte: startDate, $lte: endDate }
    }

    // Role-specific filtering
    if (user.role === "faculty") {
      // Faculty can only see their own sessions
      query.faculty = user._id
    } else if (user.role === "student") {
      // Students can only see sessions for their department and year
      query.department = user.department
      query.year = user.year
    }

    console.log("Sessions query:", JSON.stringify(query))

    // Update session statuses based on current date
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Find sessions that should be active today
    await db.collection("sessions").updateMany(
      {
        date: {
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
        status: "upcoming",
      },
      { $set: { status: "active", updatedAt: new Date() } },
    )

    // Find sessions that are past and should be completed
    await db.collection("sessions").updateMany(
      {
        date: { $lt: today },
        status: { $in: ["upcoming", "active"] },
      },
      { $set: { status: "completed", updatedAt: new Date() } },
    )

    // Execute query with pagination
    const sessions = await db
      .collection("sessions")
      .find(query)
      .sort({ date: 1, startTime: 1 }) // Changed to ascending order for date
      .skip(skip)
      .limit(limit)
      .toArray()

    // Get total count
    const total = await db.collection("sessions").countDocuments(query)

    // Populate faculty, department, and hospital information
    const populatedSessions = await Promise.all(
      sessions.map(async (session: any) => {
        // Populate faculty
        let faculty = null
        if (session.faculty) {
          faculty = await db.collection("users").findOne({ _id: new ObjectId(session.faculty) })
        }

        // Populate department
        let department = null
        if (session.department) {
          department = await db.collection("departments").findOne({ _id: new ObjectId(session.department) })
        }

        // Populate hospital
        let hospital = null
        if (session.hospital) {
          hospital = await db.collection("hospitals").findOne({ _id: new ObjectId(session.hospital) })
        }

        // Get attendance count for this session
        const attendanceCount = await db.collection("attendance").countDocuments({
          session: new ObjectId(session._id),
          status: { $in: ["present", "late"] },
        })

        // Get total students for this session
        const totalStudents = await db.collection("users").countDocuments({
          role: "student",
          department: session.department,
          year: session.year,
        })

        return {
          ...session,
          faculty: faculty ? { _id: faculty._id, name: faculty.name } : null,
          department: department ? { _id: department._id, name: department.name } : null,
          hospital: hospital ? { _id: hospital._id, name: hospital.name } : null,
          attendanceCount,
          totalStudents,
        }
      }),
    )

    return NextResponse.json({
      success: true,
      data: populatedSessions,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error("Get sessions error:", error)
    return NextResponse.json({ message: error.message || "Server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
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
      return NextResponse.json({ message: "Only faculty or admin can create sessions" }, { status: 403 })
    }

    // Get session data from request
    const sessionData = await request.json()

    // Convert string IDs to ObjectIds
    let departmentId, hospitalId

    try {
      departmentId = new ObjectId(sessionData.department)
    } catch (error) {
      return NextResponse.json({ message: "Invalid department ID format" }, { status: 400 })
    }

    try {
      hospitalId = new ObjectId(sessionData.hospital)
    } catch (error) {
      return NextResponse.json({ message: "Invalid hospital ID format" }, { status: 400 })
    }

    // Determine session status based on date
    const sessionDate = new Date(sessionData.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let status = "upcoming"
    if (sessionDate.toDateString() === today.toDateString()) {
      status = "active"
    } else if (sessionDate < today) {
      status = "completed"
    }

    // Create session
    const newSession = {
      ...sessionData,
      faculty: user._id,
      department: departmentId,
      hospital: hospitalId,
      status: status,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("sessions").insertOne(newSession)

    // Get the created session with populated data
    const createdSession = await db.collection("sessions").findOne({ _id: result.insertedId })

    // Populate faculty, department, and hospital
    const faculty = await db.collection("users").findOne({ _id: user._id })
    const department = await db.collection("departments").findOne({ _id: departmentId })
    const hospital = await db.collection("hospitals").findOne({ _id: hospitalId })

    // Get total students for this session
    const totalStudents = await db.collection("users").countDocuments({
      role: "student",
      department: departmentId,
      year: sessionData.year,
    })

    const populatedSession = {
      ...createdSession,
      faculty: faculty ? { _id: faculty._id, name: faculty.name } : null,
      department: department ? { _id: department._id, name: department.name } : null,
      hospital: hospital ? { _id: hospital._id, name: hospital.name } : null,
      attendanceCount: 0,
      totalStudents,
    }

    // Create notifications for students in this department and year
    const students = await db
      .collection("users")
      .find({
        role: "student",
        department: departmentId,
        year: sessionData.year,
      })
      .toArray()

    if (students.length > 0) {
      const notifications = students.map((student: any) => ({
        recipient: student._id,
        title: "New Session Created",
        message: `A new session "${sessionData.title}" has been created for ${new Date(sessionData.date).toLocaleDateString()} at ${sessionData.startTime}.`,
        type: "session",
        relatedTo: {
          model: "Session",
          id: result.insertedId,
        },
        isRead: false,
        createdAt: new Date(),
      }))

      await db.collection("notifications").insertMany(notifications)
    }

    return NextResponse.json({
      success: true,
      data: populatedSession,
    })
  } catch (error: any) {
    console.error("Create session error:", error)
    return NextResponse.json({ message: error.message || "Server error" }, { status: 500 })
  }
}

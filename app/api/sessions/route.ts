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
    const limit = Number.parseInt(url.searchParams.get("limit") || "10")
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const skip = (page - 1) * limit

    // Build query based on user role and parameters
    const query: any = {}

    if (status) {
      query.status = status
    }

    if (department) {
      query.department = new ObjectId(department)
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

    // Execute query with pagination
    const sessions = await db
      .collection("sessions")
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    // Get total count
    const total = await db.collection("sessions").countDocuments(query)

    // Populate faculty, department, and hospital information
    const populatedSessions = await Promise.all(
      sessions.map(async (session) => {
        // Populate faculty
        let faculty = null
        if (session.faculty) {
          faculty = await db.collection("users").findOne({ _id: session.faculty })
        }

        // Populate department
        let department = null
        if (session.department) {
          department = await db.collection("departments").findOne({ _id: session.department })
        }

        // Populate hospital
        let hospital = null
        if (session.hospital) {
          hospital = await db.collection("hospitals").findOne({ _id: session.hospital })
        }

        return {
          ...session,
          faculty: faculty ? { _id: faculty._id, name: faculty.name } : null,
          department: department ? { _id: department._id, name: department.name } : null,
          hospital: hospital ? { _id: hospital._id, name: hospital.name } : null,
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

    if (user.role !== "faculty") {
      return NextResponse.json({ message: "Only faculty can create sessions" }, { status: 403 })
    }

    // Get session data from request
    const sessionData = await request.json()

    // Create session
    const newSession = {
      ...sessionData,
      faculty: user._id,
      department: new ObjectId(sessionData.department),
      hospital: new ObjectId(sessionData.hospital),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("sessions").insertOne(newSession)

    return NextResponse.json({
      success: true,
      data: {
        _id: result.insertedId,
        ...newSession,
      },
    })
  } catch (error: any) {
    console.error("Create session error:", error)
    return NextResponse.json({ message: error.message || "Server error" }, { status: 500 })
  }
}


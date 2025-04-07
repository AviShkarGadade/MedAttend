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
      return NextResponse.json({ message: "Not authorized to access this session" }, { status: 403 })
    }

    if (
      user.role === "student" &&
      (session.department.toString() !== user.department.toString() || session.year !== user.year)
    ) {
      return NextResponse.json({ message: "Not authorized to access this session" }, { status: 403 })
    }

    // Populate faculty, department, and hospital information
    const faculty = await db.collection("users").findOne({ _id: session.faculty })
    const department = await db.collection("departments").findOne({ _id: session.department })
    const hospital = await db.collection("hospitals").findOne({ _id: session.hospital })

    const populatedSession = {
      ...session,
      faculty: faculty ? { _id: faculty._id, name: faculty.name } : null,
      department: department ? { _id: department._id, name: department.name } : null,
      hospital: hospital ? { _id: hospital._id, name: hospital.name } : null,
    }

    return NextResponse.json({
      success: true,
      data: populatedSession,
    })
  } catch (error: any) {
    console.error("Get session error:", error)
    return NextResponse.json({ message: error.message || "Server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Check if user exists and is faculty
    const user = await db.collection("users").findOne({ firebaseUid: uid })
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    if (user.role !== "faculty" && user.role !== "admin") {
      return NextResponse.json({ message: "Not authorized to update sessions" }, { status: 403 })
    }

    // Get session
    const session = await db.collection("sessions").findOne({ _id: new ObjectId(sessionId) })
    if (!session) {
      return NextResponse.json({ message: "Session not found" }, { status: 404 })
    }

    // Check authorization for faculty
    if (user.role === "faculty" && session.faculty.toString() !== user._id.toString()) {
      return NextResponse.json({ message: "Not authorized to update this session" }, { status: 403 })
    }

    // Get update data
    const updateData = await request.json()

    // Update session
    const result = await db.collection("sessions").updateOne(
      { _id: new ObjectId(sessionId) },
      {
        $set: {
          ...updateData,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "Session not found" }, { status: 404 })
    }

    // Get updated session
    const updatedSession = await db.collection("sessions").findOne({ _id: new ObjectId(sessionId) })

    return NextResponse.json({
      success: true,
      data: updatedSession,
    })
  } catch (error: any) {
    console.error("Update session error:", error)
    return NextResponse.json({ message: error.message || "Server error" }, { status: 500 })
  }
}


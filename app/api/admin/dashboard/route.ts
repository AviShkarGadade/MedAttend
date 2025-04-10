import { type NextRequest, NextResponse } from "next/server"
import { initializeApp, cert, getApps } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { connectToDatabase } from "@/lib/mongodb"

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

    // Check if user exists and has admin role
    const user = await db.collection("users").findOne({ firebaseUid: uid })
    if (!user || user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized: Admin access required" }, { status: 403 })
    }

    // Get counts
    const studentsCount = await db.collection("users").countDocuments({ role: "student" })
    const facultyCount = await db.collection("users").countDocuments({ role: "faculty" })
    const pendingFacultyCount = await db.collection("users").countDocuments({ role: "faculty", isApproved: false })
    const hospitalsCount = await db.collection("hospitals").countDocuments()

    // Get pending faculty approvals
    const pendingFaculty = await db.collection("users").find({ role: "faculty", isApproved: false }).limit(5).toArray()

    // Get recent sessions
    const recentSessions = await db.collection("sessions").find({}).sort({ createdAt: -1 }).limit(5).toArray()

    // Get hospitals
    const hospitals = await db.collection("hospitals").find({}).limit(5).toArray()

    return NextResponse.json({
      success: true,
      data: {
        admin: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        stats: {
          totalStudents: studentsCount,
          totalFaculty: facultyCount,
          totalHospitals: hospitalsCount,
          pendingApprovals: pendingFacultyCount,
        },
        pendingApprovals: pendingFaculty,
        recentSessions,
        hospitals,
      },
    })
  } catch (error: any) {
    console.error("Admin dashboard error:", error)
    return NextResponse.json({ message: error.message || "Server error" }, { status: 500 })
  }
}

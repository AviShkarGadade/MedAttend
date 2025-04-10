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

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { token, name, email, role } = data

    // Verify the Firebase ID token
    const decodedToken = await getAuth().verifyIdToken(token)
    const uid = decodedToken.uid

    // Connect to MongoDB
    const { db } = await connectToDatabase()

    // Check if user already exists
    const existingUser = await db.collection("users").findOne({ firebaseUid: uid })

    if (existingUser) {
      return NextResponse.json({ message: "User already exists" }, { status: 400 })
    }

    // Create new user in MongoDB
    const newUser = {
      firebaseUid: uid,
      name,
      email,
      role,
      isApproved: role === "student" || role === "admin", // Students and admins are auto-approved
      createdAt: new Date(),
    }

    // Add role-specific fields
    if (role === "student") {
      newUser.studentId = data.studentId
      newUser.department = data.department
      newUser.year = data.year
    } else if (role === "faculty") {
      newUser.facultyId = data.facultyId
      newUser.department = data.department
      newUser.hospital = data.hospital
    }

    await db.collection("users").insertOne(newUser)

    // If faculty role, create a pending approval record
    if (role === "faculty") {
      await db.collection("pendingApprovals").insertOne({
        userId: newUser._id,
        name,
        email,
        role,
        facultyId: data.facultyId,
        department: data.department,
        hospital: data.hospital,
        requestDate: new Date(),
        status: "pending",
      })
    }

    return NextResponse.json({
      message: "User registered successfully",
      isApproved: newUser.isApproved,
    })
  } catch (error: any) {
    console.error("Registration error:", error)

    return NextResponse.json({ message: error.message || "Registration failed" }, { status: 400 })
  }
}

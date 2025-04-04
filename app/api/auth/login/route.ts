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
    const { token } = await request.json()

    // Verify the Firebase ID token
    const decodedToken = await getAuth().verifyIdToken(token)
    const uid = decodedToken.uid

    // Connect to MongoDB
    const { db } = await connectToDatabase()

    // Find the user in the database
    const user = await db.collection("users").findOne({ firebaseUid: uid })

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Check if faculty account is approved
    if (user.role === "faculty" && !user.isApproved) {
      return NextResponse.json({ message: "Faculty account pending approval" }, { status: 403 })
    }

    // Return user data with role
    return NextResponse.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    })
  } catch (error: any) {
    console.error("Login error:", error)

    return NextResponse.json({ message: error.message || "Authentication failed" }, { status: 401 })
  }
}


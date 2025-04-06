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
    console.log("Test role request received with token")

    // Verify the Firebase ID token
    const decodedToken = await getAuth().verifyIdToken(token)
    const uid = decodedToken.uid
    console.log("Token verified for UID:", uid)

    // Connect to MongoDB
    const { db } = await connectToDatabase()

    // Find the user in the database
    const user = await db.collection("users").findOne({ firebaseUid: uid })
    console.log("User found:", user)

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
          uid: uid,
        },
        { status: 404 },
      )
    }

    // Return detailed user data for debugging
    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        firebaseUid: user.firebaseUid,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        hospital: user.hospital,
        isApproved: user.isApproved,
      },
    })
  } catch (error: any) {
    console.error("Test role error:", error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Authentication failed",
        error: error.stack,
      },
      { status: 401 },
    )
  }
}


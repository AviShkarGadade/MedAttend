import { type NextRequest, NextResponse } from "next/server"
import { initializeApp, cert, getApps } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import logger from "@/lib/logger"

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
    // Ensure params is properly awaited
    const sessionId = params?.id

    if (!sessionId) {
      logger.warn("Session ID is required but was not provided")
      return NextResponse.json({ message: "Session ID is required" }, { status: 400 })
    }

    // Get token from authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      logger.warn("Unauthorized access attempt - missing or invalid authorization header")
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]

    // Verify the Firebase ID token
    const decodedToken = await getAuth().verifyIdToken(token)
    const uid = decodedToken.uid
    logger.info(`User ${uid} requesting session ${sessionId}`)

    // Connect to MongoDB
    const { db } = await connectToDatabase()

    // Check if user exists
    const user = await db.collection("users").findOne({ firebaseUid: uid })
    if (!user) {
      logger.warn(`User with Firebase UID ${uid} not found in database`)
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Validate sessionId format
    let sessionObjectId
    try {
      sessionObjectId = new ObjectId(sessionId)
      logger.debug(`Valid ObjectId format for session: ${sessionId}`)
    } catch (error) {
      logger.warn(`Invalid session ID format: ${sessionId}, attempting to find by other identifiers`)
      // If not a valid ObjectId, try to find by other identifiers
      const session = await db.collection("sessions").findOne({
        $or: [{ id: sessionId }, { externalId: sessionId }],
      })

      if (!session) {
        logger.warn(`No session found with ID or externalId: ${sessionId}`)
        return NextResponse.json(
          { message: "Invalid session ID format and no matching session found" },
          { status: 400 },
        )
      }

      sessionObjectId = session._id
      logger.debug(`Found session by alternative identifier, using ObjectId: ${sessionObjectId}`)
    }

    // Get session
    const session = await db.collection("sessions").findOne({ _id: sessionObjectId })
    if (!session) {
      logger.warn(`Session not found with ID: ${sessionObjectId}`)
      return NextResponse.json({ message: "Session not found" }, { status: 404 })
    }

    // Check authorization based on role
    if (user.role === "faculty" && session.faculty.toString() !== user._id.toString()) {
      logger.warn(`Faculty ${user._id} not authorized to access session ${sessionObjectId}`)
      return NextResponse.json({ message: "Not authorized to access this session" }, { status: 403 })
    }

    if (
      user.role === "student" &&
      (session.department.toString() !== user.department.toString() || session.year !== user.year)
    ) {
      logger.warn(`Student ${user._id} not authorized to access session ${sessionObjectId}`)
      return NextResponse.json({ message: "Not authorized to access this session" }, { status: 403 })
    }

    // Populate faculty, department, and hospital information
    const faculty = await db.collection("users").findOne({ _id: session.faculty })
    const department = await db.collection("departments").findOne({ _id: session.department })
    const hospital = await db.collection("hospitals").findOne({ _id: session.hospital })

    // Get attendance count for this session
    const attendanceCount = await db.collection("attendance").countDocuments({
      session: sessionObjectId,
      status: { $in: ["present", "late"] },
    })

    // Get total students for this session
    const totalStudents = await db.collection("users").countDocuments({
      role: "student",
      department: session.department,
      year: session.year,
    })

    const populatedSession = {
      ...session,
      faculty: faculty ? { _id: faculty._id, name: faculty.name } : null,
      department: department ? { _id: department._id, name: department.name } : null,
      hospital: hospital ? { _id: hospital._id, name: hospital.name } : null,
      attendanceCount,
      totalStudents,
    }

    logger.info(`Successfully retrieved session ${sessionId} for user ${uid}`)
    return NextResponse.json({
      success: true,
      data: populatedSession,
    })
  } catch (error: any) {
    logger.error(`Get session error: ${error.message}`)
    logger.error(error.stack)
    return NextResponse.json({ message: error.message || "Server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionId = params?.id

    if (!sessionId) {
      logger.warn("Session ID is required but was not provided")
      return NextResponse.json({ message: "Session ID is required" }, { status: 400 })
    }

    // Get token from authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      logger.warn("Unauthorized access attempt - missing or invalid authorization header")
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]

    // Verify the Firebase ID token
    const decodedToken = await getAuth().verifyIdToken(token)
    const uid = decodedToken.uid
    logger.info(`User ${uid} attempting to update session ${sessionId}`)

    // Connect to MongoDB
    const { db } = await connectToDatabase()

    // Check if user exists and is faculty
    const user = await db.collection("users").findOne({ firebaseUid: uid })
    if (!user) {
      logger.warn(`User with Firebase UID ${uid} not found in database`)
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    if (user.role !== "faculty" && user.role !== "admin") {
      logger.warn(`User ${uid} with role ${user.role} not authorized to update sessions`)
      return NextResponse.json({ message: "Not authorized to update sessions" }, { status: 403 })
    }

    // Validate sessionId format
    let sessionObjectId
    try {
      sessionObjectId = new ObjectId(sessionId)
      logger.debug(`Valid ObjectId format for session: ${sessionId}`)
    } catch (error) {
      logger.warn(`Invalid session ID format: ${sessionId}, attempting to find by other identifiers`)
      // If not a valid ObjectId, try to find by other identifiers
      const session = await db.collection("sessions").findOne({
        $or: [{ id: sessionId }, { externalId: sessionId }],
      })

      if (!session) {
        logger.warn(`No session found with ID or externalId: ${sessionId}`)
        return NextResponse.json(
          { message: "Invalid session ID format and no matching session found" },
          { status: 400 },
        )
      }

      sessionObjectId = session._id
      logger.debug(`Found session by alternative identifier, using ObjectId: ${sessionObjectId}`)
    }

    // Get session
    const session = await db.collection("sessions").findOne({ _id: sessionObjectId })
    if (!session) {
      logger.warn(`Session not found with ID: ${sessionObjectId}`)
      return NextResponse.json({ message: "Session not found" }, { status: 404 })
    }

    // Check authorization for faculty
    if (user.role === "faculty" && session.faculty.toString() !== user._id.toString()) {
      logger.warn(`Faculty ${user._id} not authorized to update session ${sessionObjectId}`)
      return NextResponse.json({ message: "Not authorized to update this session" }, { status: 403 })
    }

    // Get update data
    const updateData = await request.json()
    logger.debug(`Update data for session ${sessionId}: ${JSON.stringify(updateData)}`)

    // Update session
    const result = await db.collection("sessions").updateOne(
      { _id: sessionObjectId },
      {
        $set: {
          ...updateData,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      logger.warn(`No session matched for update with ID: ${sessionObjectId}`)
      return NextResponse.json({ message: "Session not found" }, { status: 404 })
    }

    // Get updated session
    const updatedSession = await db.collection("sessions").findOne({ _id: sessionObjectId })
    logger.info(`Successfully updated session ${sessionId}`)

    return NextResponse.json({
      success: true,
      data: updatedSession,
    })
  } catch (error: any) {
    logger.error(`Update session error: ${error.message}`)
    logger.error(error.stack)
    return NextResponse.json({ message: error.message || "Server error" }, { status: 500 })
  }
}

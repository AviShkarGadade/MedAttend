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
    const { token, name, email, password, role, department, studentId, year, facultyId, hospital } = data

    // Verify the Firebase ID token
    const decodedToken = await getAuth().verifyIdToken(token)
    const adminUid = decodedToken.uid

    // Connect to MongoDB
    const { db } = await connectToDatabase()

    // Check if admin user exists and has admin role
    const adminUser = await db.collection("users").findOne({ firebaseUid: adminUid })
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized: Only admins can create users" }, { status: 403 })
    }

    // Check if user with this email already exists
    const existingUser = await db.collection("users").findOne({ email })
    if (existingUser) {
      return NextResponse.json({ message: "User with this email already exists" }, { status: 400 })
    }

    // Create user in Firebase
    const userRecord = await getAuth().createUser({
      email,
      password,
      displayName: name,
    })

    // Create user in MongoDB
    const newUser = {
      firebaseUid: userRecord.uid,
      name,
      email,
      role,
      isApproved: true, // Admin-created users are auto-approved
      createdAt: new Date(),
    }

    // Add role-specific fields
    if (role === "student") {
      // Check if student ID already exists
      const existingStudentId = await db.collection("users").findOne({ studentId })
      if (existingStudentId) {
        // Delete the Firebase user since we won't be creating the MongoDB user
        await getAuth().deleteUser(userRecord.uid)
        return NextResponse.json({ message: "Student ID already exists" }, { status: 400 })
      }

      newUser.studentId = studentId
      newUser.department = department
      newUser.year = year
    } else if (role === "faculty") {
      // Check if faculty ID already exists
      const existingFacultyId = await db.collection("users").findOne({ facultyId })
      if (existingFacultyId) {
        // Delete the Firebase user since we won't be creating the MongoDB user
        await getAuth().deleteUser(userRecord.uid)
        return NextResponse.json({ message: "Faculty ID already exists" }, { status: 400 })
      }

      newUser.facultyId = facultyId
      newUser.department = department
      newUser.hospital = hospital
    }

    // Insert user into MongoDB
    const result = await db.collection("users").insertOne(newUser)

    return NextResponse.json({
      message: "User created successfully",
      userId: result.insertedId,
    })
  } catch (error: any) {
    console.error("Create user error:", error)
    return NextResponse.json({ message: error.message || "Failed to create user" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const url = new URL(request.url)
    const role = url.searchParams.get("role")
    const department = url.searchParams.get("department")
    const year = url.searchParams.get("year")
    const search = url.searchParams.get("search")
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const limit = Number.parseInt(url.searchParams.get("limit") || "10")

    // Connect to MongoDB
    const { db } = await connectToDatabase()

    // Build query
    const query: any = {}

    if (role) {
      query.role = role
    }

    if (department) {
      query.department = department
    }

    if (year && role === "student") {
      query.year = Number.parseInt(year)
    }

    if (search) {
      query.$or = [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }]

      // Add role-specific search
      if (role === "student") {
        query.$or.push({ studentId: { $regex: search, $options: "i" } })
      } else if (role === "faculty") {
        query.$or.push({ facultyId: { $regex: search, $options: "i" } })
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Execute query
    const users = await db.collection("users").find(query).skip(skip).limit(limit).sort({ createdAt: -1 }).toArray()

    // Get total count
    const total = await db.collection("users").countDocuments(query)

    return NextResponse.json({
      data: users,
      count: users.length,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error("Get users error:", error)
    return NextResponse.json({ message: error.message || "Failed to get users" }, { status: 500 })
  }
}


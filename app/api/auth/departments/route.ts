import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    // Connect to MongoDB
    const { db } = await connectToDatabase()

    // Get all departments
    const departments = await db.collection("departments").find({}).toArray()

    return NextResponse.json({
      data: departments,
      count: departments.length,
    })
  } catch (error: any) {
    console.error("Get departments error:", error)
    return NextResponse.json({ message: error.message || "Failed to get departments" }, { status: 500 })
  }
}


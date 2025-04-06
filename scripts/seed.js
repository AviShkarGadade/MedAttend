
require("dotenv").config()
const { MongoClient, ObjectId } = require("mongodb")
const bcrypt = require("bcryptjs")
const admin = require("firebase-admin")

const MONGODB_URI = process.env.MONGODB_URI
const MONGODB_DB = process.env.MONGODB_DB

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable")
}

if (!MONGODB_DB) {
  throw new Error("Please define the MONGODB_DB environment variable")
}

// Initialize Firebase Admin SDK
const serviceAccount = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
}

// Check if Firebase Admin is already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
}

async function seed() {
  console.log("Starting database seed...")

  // Connect to MongoDB
  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  const db = client.db(MONGODB_DB)

  try {
    // Clear existing collections
    await db.collection("users").deleteMany({})
    await db.collection("hospitals").deleteMany({})
    await db.collection("departments").deleteMany({})
    await db.collection("sessions").deleteMany({})
    await db.collection("attendance").deleteMany({})
    await db.collection("notifications").deleteMany({})

    console.log("Existing data cleared")

    // Create departments
    const departments = [
      { name: "Cardiology", description: "Heart and cardiovascular system", createdAt: new Date() },
      { name: "Neurology", description: "Brain and nervous system", createdAt: new Date() },
      { name: "Pediatrics", description: "Medical care of infants, children, and adolescents", createdAt: new Date() },
      { name: "Surgery", description: "Surgical procedures and care", createdAt: new Date() },
      { name: "Internal Medicine", description: "Diagnosis and treatment of adult diseases", createdAt: new Date() },
      { name: "Emergency Medicine", description: "Acute care of patients", createdAt: new Date() },
      { name: "Obstetrics & Gynecology", description: "Women's health and pregnancy", createdAt: new Date() },
      { name: "Psychiatry", description: "Mental health diagnosis and treatment", createdAt: new Date() },
      { name: "Radiology", description: "Medical imaging and diagnostics", createdAt: new Date() },
      {
        name: "Anesthesiology",
        description: "Perioperative care, anesthesia, and pain management",
        createdAt: new Date(),
      },
    ]

    const departmentResult = await db.collection("departments").insertMany(departments)
    console.log(`${departmentResult.insertedCount} departments inserted`)

    // Create hospitals
    const hospitals = [
      {
        name: "City General Hospital",
        address: "123 Main Street",
        city: "Cityville",
        state: "State",
        zipCode: "12345",
        coordinates: {
          latitude: 40.7128,
          longitude: -74.006,
        },
        createdAt: new Date(),
      },
      {
        name: "University Hospital",
        address: "456 College Drive",
        city: "Academicville",
        state: "State",
        zipCode: "23456",
        coordinates: {
          latitude: 40.7282,
          longitude: -73.9942,
        },
        createdAt: new Date(),
      },
      {
        name: "Children's Medical Center",
        address: "789 Pediatric Lane",
        city: "Kidsville",
        state: "State",
        zipCode: "34567",
        coordinates: {
          latitude: 40.7312,
          longitude: -74.0123,
        },
        createdAt: new Date(),
      },
      {
        name: "Riverside Medical Center",
        address: "321 Waterfront Road",
        city: "Riverside",
        state: "State",
        zipCode: "45678",
        coordinates: {
          latitude: 40.7023,
          longitude: -73.9876,
        },
        createdAt: new Date(),
      },
      {
        name: "Memorial Hospital",
        address: "555 Heritage Avenue",
        city: "Memorialville",
        state: "State",
        zipCode: "56789",
        coordinates: {
          latitude: 40.7432,
          longitude: -74.0231,
        },
        createdAt: new Date(),
      },
    ]

    const hospitalResult = await db.collection("hospitals").insertMany(hospitals)
    console.log(`${hospitalResult.insertedCount} hospitals inserted`)

    // Create admin users in Firebase
    const adminData = [
      {
        name: "Admin User",
        email: "admin@medattend.com",
        password: "password123",
        role: "admin",
        department: departmentResult.insertedIds[0],
      },
      {
        name: "System Admin",
        email: "sysadmin@medattend.com",
        password: "password123",
        role: "admin",
        department: departmentResult.insertedIds[1],
      },
    ]

    const adminUsers = []
    for (const adminUser of adminData) {
      // Create user in Firebase
      let firebaseUid
      try {
        const userRecord = await admin.auth().createUser({
          email: adminUser.email,
          password: adminUser.password,
          displayName: adminUser.name,
        })
        firebaseUid = userRecord.uid
        console.log(`Admin user ${adminUser.email} created in Firebase`)
      } catch (error) {
        // If user already exists, get the UID
        if (error.code === "auth/email-already-exists") {
          const userRecord = await admin.auth().getUserByEmail(adminUser.email)
          firebaseUid = userRecord.uid
          console.log(`Admin user ${adminUser.email} already exists in Firebase`)
        } else {
          throw error
        }
      }

      // Create admin user in MongoDB
      const adminUserDoc = {
        firebaseUid: firebaseUid,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        department: adminUser.department,
        isApproved: true,
        createdAt: new Date(),
      }

      adminUsers.push(adminUserDoc)
    }

    const adminResult = await db.collection("users").insertMany(adminUsers)
    console.log(`${adminResult.insertedCount} admin users created in MongoDB`)

    // Create faculty users
    const facultyData = [
      {
        name: "Dr. Sarah Williams",
        email: "sarah.williams@medattend.com",
        password: "password123",
        role: "faculty",
        facultyId: "FAC2023012",
        department: departmentResult.insertedIds[0], // Cardiology
        hospital: hospitalResult.insertedIds[0], // City General Hospital
        isApproved: true,
      },
      {
        name: "Dr. Michael Chen",
        email: "michael.chen@medattend.com",
        password: "password123",
        role: "faculty",
        facultyId: "FAC2023013",
        department: departmentResult.insertedIds[1], // Neurology
        hospital: hospitalResult.insertedIds[1], // University Hospital
        isApproved: true,
      },
      {
        name: "Dr. Emily Rodriguez",
        email: "emily.rodriguez@medattend.com",
        password: "password123",
        role: "faculty",
        facultyId: "FAC2023014",
        department: departmentResult.insertedIds[2], // Pediatrics
        hospital: hospitalResult.insertedIds[2], // Children's Medical Center
        isApproved: true,
      },
      {
        name: "Dr. John Smith",
        email: "john.smith@medattend.com",
        password: "password123",
        role: "faculty",
        facultyId: "FAC2023015",
        department: departmentResult.insertedIds[4], // Internal Medicine
        hospital: hospitalResult.insertedIds[0], // City General Hospital
        isApproved: false,
      },
    ]

    const facultyUsers = []
    for (const faculty of facultyData) {
      // Create user in Firebase
      let firebaseUid
      try {
        const userRecord = await admin.auth().createUser({
          email: faculty.email,
          password: faculty.password,
          displayName: faculty.name,
        })
        firebaseUid = userRecord.uid
      } catch (error) {
        // If user already exists, get the UID
        if (error.code === "auth/email-already-exists") {
          const userRecord = await admin.auth().getUserByEmail(faculty.email)
          firebaseUid = userRecord.uid
        } else {
          throw error
        }
      }

      // Create user in MongoDB
      const facultyUser = {
        firebaseUid,
        name: faculty.name,
        email: faculty.email,
        role: faculty.role,
        facultyId: faculty.facultyId,
        department: faculty.department,
        hospital: faculty.hospital,
        isApproved: faculty.isApproved,
        createdAt: new Date(),
      }

      facultyUsers.push(facultyUser)
    }

    const facultyResult = await db.collection("users").insertMany(facultyUsers)
    console.log(`${facultyResult.insertedCount} faculty users created`)

    // Create pending approval for unapproved faculty
    const pendingFaculty = facultyUsers.find((f) => !f.isApproved)
    if (pendingFaculty) {
      await db.collection("notifications").insertOne({
        recipient: adminResult.insertedIds[0],
        title: "New Faculty Registration",
        message: `${pendingFaculty.name} has registered as faculty and is awaiting approval.`,
        type: "approval",
        relatedTo: {
          model: "User",
          id: facultyResult.insertedIds[3],
        },
        isRead: false,
        createdAt: new Date(),
      })
    }

    // Create student users
    const studentData = []
    const firstNames = ["Alex", "Maria", "James", "Emily", "David", "Sophia", "John", "Olivia", "Daniel", "Emma"]
    const lastNames = ["Johnson", "Garcia", "Wilson", "Chen", "Smith", "Brown", "Davis", "Miller", "Jones", "Williams"]

    for (let i = 0; i < 20; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
      const name = `${firstName} ${lastName}`
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@student.medattend.com`
      const departmentIndex = Math.floor(Math.random() * 5) // Assign to first 5 departments
      const year = Math.floor(Math.random() * 3) + 3 // Year 3-5

      studentData.push({
        name,
        email,
        password: "password123",
        role: "student",
        studentId: `MED2023${(i + 1).toString().padStart(3, "0")}`,
        department: departmentResult.insertedIds[departmentIndex],
        year,
        isApproved: true,
      })
    }

    const studentUsers = []
    for (const student of studentData) {
      // Create user in Firebase
      let firebaseUid
      try {
        const userRecord = await admin.auth().createUser({
          email: student.email,
          password: student.password,
          displayName: student.name,
        })
        firebaseUid = userRecord.uid
      } catch (error) {
        // If user already exists, get the UID
        if (error.code === "auth/email-already-exists") {
          const userRecord = await admin.auth().getUserByEmail(student.email)
          firebaseUid = userRecord.uid
        } else {
          throw error
        }
      }

      // Create user in MongoDB
      const studentUser = {
        firebaseUid,
        name: student.name,
        email: student.email,
        role: student.role,
        studentId: student.studentId,
        department: student.department,
        year: student.year,
        isApproved: student.isApproved,
        createdAt: new Date(),
      }

      studentUsers.push(studentUser)
    }

    const studentResult = await db.collection("users").insertMany(studentUsers)
    console.log(`${studentResult.insertedCount} student users created`)

    console.log("Database seed completed successfully!")
  } catch (error) {
    console.error("Error seeding database:", error)
  } finally {
    await client.close()
  }
}

seed().catch(console.error)


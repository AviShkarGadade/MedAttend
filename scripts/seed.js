/**
 * Database Seed Script
 *
 * This script populates the MongoDB database with initial data for testing purposes.
 * Run with: node scripts/seed.js
 */

require("dotenv").config()
const { MongoClient, ObjectId } = require("mongodb")
const bcrypt = require("bcryptjs")
const admin = require("firebase-admin")
const crypto = require("crypto")

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

// Generate a secure random password
const generateSecurePassword = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()"
  let password = ""
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
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
        department: departmentResult.insertedIds[0],
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
        role: "faculty",
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

    // Create student users with enhanced data
    const studentData = [
      {
        name: "Alex Johnson",
        email: "alex.johnson@student.medattend.com",
        studentId: "MED2023001",
        department: departmentResult.insertedIds[0], // Cardiology
        year: 3,
        isApproved: true,
        dateOfBirth: "1998-05-15",
        gender: "Male",
        phoneNumber: "555-123-4567",
        address: "123 Student Housing, University Campus",
        emergencyContact: {
          name: "Robert Johnson",
          relationship: "Father",
          phoneNumber: "555-987-6543",
        },
        academicInfo: {
          gpa: 3.8,
          enrollmentDate: "2021-09-01",
          expectedGraduation: "2025-06-15",
        },
        clinicalInterests: ["Interventional Cardiology", "Cardiac Electrophysiology"],
        rotationHistory: [
          {
            hospital: "University Hospital",
            department: "Internal Medicine",
            startDate: "2024-01-10",
            endDate: "2024-02-10",
            supervisor: "Dr. James Wilson",
          },
        ],
      },
      {
        name: "Maria Garcia",
        email: "maria.garcia@student.medattend.com",
        studentId: "MED2023002",
        department: departmentResult.insertedIds[0], // Cardiology
        year: 3,
        isApproved: true,
        dateOfBirth: "1997-08-22",
        gender: "Female",
        phoneNumber: "555-234-5678",
        address: "456 Medical Student Apartments, Apt 302",
        emergencyContact: {
          name: "Elena Garcia",
          relationship: "Mother",
          phoneNumber: "555-876-5432",
        },
        academicInfo: {
          gpa: 3.9,
          enrollmentDate: "2021-09-01",
          expectedGraduation: "2025-06-15",
        },
        clinicalInterests: ["Preventive Cardiology", "Heart Failure"],
        rotationHistory: [
          {
            hospital: "City General Hospital",
            department: "Emergency Medicine",
            startDate: "2024-01-15",
            endDate: "2024-02-15",
            supervisor: "Dr. Sarah Williams",
          },
        ],
      },
      {
        name: "James Wilson",
        email: "james.wilson@student.medattend.com",
        studentId: "MED2023003",
        department: departmentResult.insertedIds[1], // Neurology
        year: 4,
        isApproved: true,
        dateOfBirth: "1996-11-30",
        gender: "Male",
        phoneNumber: "555-345-6789",
        address: "789 Medical Campus Drive, Building C",
        emergencyContact: {
          name: "Margaret Wilson",
          relationship: "Mother",
          phoneNumber: "555-765-4321",
        },
        academicInfo: {
          gpa: 3.7,
          enrollmentDate: "2020-09-01",
          expectedGraduation: "2024-06-15",
        },
        clinicalInterests: ["Neurosurgery", "Stroke Medicine"],
        rotationHistory: [
          {
            hospital: "University Hospital",
            department: "Neurology",
            startDate: "2024-02-01",
            endDate: "2024-03-01",
            supervisor: "Dr. Michael Chen",
          },
        ],
      },
      {
        name: "Emily Chen",
        email: "emily.chen@student.medattend.com",
        studentId: "MED2023004",
        department: departmentResult.insertedIds[1], // Neurology
        year: 4,
        isApproved: true,
        dateOfBirth: "1997-04-12",
        gender: "Female",
        phoneNumber: "555-456-7890",
        address: "321 University Heights, Apt 405",
        emergencyContact: {
          name: "David Chen",
          relationship: "Father",
          phoneNumber: "555-654-3210",
        },
        academicInfo: {
          gpa: 4.0,
          enrollmentDate: "2020-09-01",
          expectedGraduation: "2024-06-15",
        },
        clinicalInterests: ["Neuroimaging", "Epilepsy"],
        rotationHistory: [
          {
            hospital: "Memorial Hospital",
            department: "Neurology",
            startDate: "2024-02-15",
            endDate: "2024-03-15",
            supervisor: "Dr. Michael Chen",
          },
        ],
      },
      {
        name: "David Kim",
        email: "david.kim@student.medattend.com",
        studentId: "MED2023005",
        department: departmentResult.insertedIds[2], // Pediatrics
        year: 5,
        isApproved: true,
        dateOfBirth: "1995-07-08",
        gender: "Male",
        phoneNumber: "555-567-8901",
        address: "567 Medical Student Housing, Room 210",
        emergencyContact: {
          name: "Jennifer Kim",
          relationship: "Sister",
          phoneNumber: "555-543-2109",
        },
        academicInfo: {
          gpa: 3.6,
          enrollmentDate: "2019-09-01",
          expectedGraduation: "2023-06-15",
        },
        clinicalInterests: ["Pediatric Oncology", "Neonatology"],
        rotationHistory: [
          {
            hospital: "Children's Medical Center",
            department: "Pediatrics",
            startDate: "2024-03-01",
            endDate: "2024-04-01",
            supervisor: "Dr. Emily Rodriguez",
          },
        ],
      },
      {
        name: "Sophia Brown",
        email: "sophia.brown@student.medattend.com",
        studentId: "MED2023006",
        department: departmentResult.insertedIds[2], // Pediatrics
        year: 5,
        isApproved: true,
        dateOfBirth: "1995-09-23",
        gender: "Female",
        phoneNumber: "555-678-9012",
        address: "678 University Commons, Apt 512",
        emergencyContact: {
          name: "Michael Brown",
          relationship: "Father",
          phoneNumber: "555-432-1098",
        },
        academicInfo: {
          gpa: 3.8,
          enrollmentDate: "2019-09-01",
          expectedGraduation: "2023-06-15",
        },
        clinicalInterests: ["Pediatric Cardiology", "Developmental Pediatrics"],
        rotationHistory: [
          {
            hospital: "Children's Medical Center",
            department: "Pediatrics",
            startDate: "2024-03-15",
            endDate: "2024-04-15",
            supervisor: "Dr. Emily Rodriguez",
          },
        ],
      },
      {
        name: "John Smith",
        email: "john.smith@student.medattend.com",
        studentId: "MED2023007",
        department: departmentResult.insertedIds[3], // Surgery
        year: 6,
        isApproved: true,
        dateOfBirth: "1994-02-18",
        gender: "Male",
        phoneNumber: "555-789-0123",
        address: "789 Medical Residence Hall, Room 305",
        emergencyContact: {
          name: "Sarah Smith",
          relationship: "Mother",
          phoneNumber: "555-321-0987",
        },
        academicInfo: {
          gpa: 3.5,
          enrollmentDate: "2018-09-01",
          expectedGraduation: "2022-06-15",
        },
        clinicalInterests: ["Trauma Surgery", "Orthopedic Surgery"],
        rotationHistory: [
          {
            hospital: "City General Hospital",
            department: "Surgery",
            startDate: "2024-04-01",
            endDate: "2024-05-01",
            supervisor: "Dr. Robert Johnson",
          },
        ],
      },
      {
        name: "Olivia Davis",
        email: "olivia.davis@student.medattend.com",
        studentId: "MED2023008",
        department: departmentResult.insertedIds[3], // Surgery
        year: 6,
        isApproved: true,
        dateOfBirth: "1994-05-30",
        gender: "Female",
        phoneNumber: "555-890-1234",
        address: "890 Medical Campus Apartments, Apt 615",
        emergencyContact: {
          name: "James Davis",
          relationship: "Father",
          phoneNumber: "555-210-9876",
        },
        academicInfo: {
          gpa: 3.9,
          enrollmentDate: "2018-09-01",
          expectedGraduation: "2022-06-15",
        },
        clinicalInterests: ["Cardiothoracic Surgery", "Plastic Surgery"],
        rotationHistory: [
          {
            hospital: "University Hospital",
            department: "Surgery",
            startDate: "2024-04-15",
            endDate: "2024-05-15",
            supervisor: "Dr. Thomas Wilson",
          },
        ],
      },
      {
        name: "Daniel Miller",
        email: "daniel.miller@student.medattend.com",
        studentId: "MED2023009",
        department: departmentResult.insertedIds[4], // Internal Medicine
        year: 7,
        isApproved: true,
        dateOfBirth: "1993-11-12",
        gender: "Male",
        phoneNumber: "555-901-2345",
        address: "901 University Terrace, Apt 720",
        emergencyContact: {
          name: "Elizabeth Miller",
          relationship: "Mother",
          phoneNumber: "555-109-8765",
        },
        academicInfo: {
          gpa: 3.7,
          enrollmentDate: "2017-09-01",
          expectedGraduation: "2021-06-15",
        },
        clinicalInterests: ["Gastroenterology", "Pulmonology"],
        rotationHistory: [
          {
            hospital: "Riverside Medical Center",
            department: "Internal Medicine",
            startDate: "2024-05-01",
            endDate: "2024-06-01",
            supervisor: "Dr. John Smith",
          },
        ],
      },
      {
        name: "Emma Jones",
        email: "emma.jones@student.medattend.com",
        studentId: "MED2023010",
        department: departmentResult.insertedIds[4], // Internal Medicine
        year: 7,
        isApproved: true,
        dateOfBirth: "1993-08-05",
        gender: "Female",
        phoneNumber: "555-012-3456",
        address: "012 Medical Student Residences, Room 825",
        emergencyContact: {
          name: "William Jones",
          relationship: "Father",
          phoneNumber: "555-098-7654",
        },
        academicInfo: {
          gpa: 3.8,
          enrollmentDate: "2017-09-01",
          expectedGraduation: "2021-06-15",
        },
        clinicalInterests: ["Endocrinology", "Rheumatology"],
        rotationHistory: [
          {
            hospital: "Memorial Hospital",
            department: "Internal Medicine",
            startDate: "2024-05-15",
            endDate: "2024-06-15",
            supervisor: "Dr. John Smith",
          },
        ],
      },
    ]

    const studentUsers = []
    for (const student of studentData) {
      // Generate a secure password for each student
      const securePassword = generateSecurePassword()

      // Create user in Firebase
      let firebaseUid
      try {
        const userRecord = await admin.auth().createUser({
          email: student.email,
          password: securePassword, // Use the secure generated password
          displayName: student.name,
        })
        firebaseUid = userRecord.uid
        console.log(`Student user ${student.email} created in Firebase with secure password`)
      } catch (error) {
        // If user already exists, get the UID
        if (error.code === "auth/email-already-exists") {
          const userRecord = await admin.auth().getUserByEmail(student.email)
          firebaseUid = userRecord.uid
          console.log(`Student user ${student.email} already exists in Firebase`)
        } else {
          throw error
        }
      }

      // Create user in MongoDB (without storing the password)
      const studentUser = {
        firebaseUid,
        name: student.name,
        email: student.email,
        role: "student",
        studentId: student.studentId,
        department: student.department,
        year: student.year,
        isApproved: student.isApproved,
        dateOfBirth: student.dateOfBirth,
        gender: student.gender,
        phoneNumber: student.phoneNumber,
        address: student.address,
        emergencyContact: student.emergencyContact,
        academicInfo: student.academicInfo,
        clinicalInterests: student.clinicalInterests,
        rotationHistory: student.rotationHistory,
        createdAt: new Date(),
      }

      studentUsers.push(studentUser)
    }

    const studentResult = await db.collection("users").insertMany(studentUsers)
    console.log(`${studentResult.insertedCount} student users created`)

    // Create some sample sessions for testing
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const sessions = [
      {
        title: "Morning Rounds - Cardiology",
        description: "Daily morning rounds for cardiology department",
        date: today,
        startTime: "08:00",
        endTime: "10:00",
        faculty: facultyResult.insertedIds[0], // Dr. Sarah Williams
        department: departmentResult.insertedIds[0], // Cardiology
        hospital: hospitalResult.insertedIds[0], // City General Hospital
        location: "Cardiology Wing, 3rd Floor",
        coordinates: {
          latitude: 40.7128,
          longitude: -74.006,
        },
        radius: 100,
        enableGeolocation: true,
        enableQRCode: true,
        qrCodeSecret: crypto.randomBytes(32).toString("hex"),
        qrCodeExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
        year: 3,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: "Neurology Case Study",
        description: "Review of interesting neurology cases",
        date: today,
        startTime: "13:00",
        endTime: "15:00",
        faculty: facultyResult.insertedIds[1], // Dr. Michael Chen
        department: departmentResult.insertedIds[1], // Neurology
        hospital: hospitalResult.insertedIds[1], // University Hospital
        location: "Conference Room B, 2nd Floor",
        coordinates: {
          latitude: 40.7282,
          longitude: -73.9942,
        },
        radius: 100,
        enableGeolocation: true,
        enableQRCode: true,
        qrCodeSecret: crypto.randomBytes(32).toString("hex"),
        qrCodeExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
        year: 4,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: "Pediatric Examination Techniques",
        description: "Hands-on workshop for pediatric examination",
        date: tomorrow,
        startTime: "09:00",
        endTime: "12:00",
        faculty: facultyResult.insertedIds[2], // Dr. Emily Rodriguez
        department: departmentResult.insertedIds[2], // Pediatrics
        hospital: hospitalResult.insertedIds[2], // Children's Medical Center
        location: "Training Room A, 1st Floor",
        coordinates: {
          latitude: 40.7312,
          longitude: -74.0123,
        },
        radius: 100,
        enableGeolocation: true,
        enableQRCode: true,
        qrCodeSecret: crypto.randomBytes(32).toString("hex"),
        qrCodeExpiry: new Date(Date.now() + 48 * 60 * 60 * 1000),
        year: 5,
        status: "upcoming",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: "Internal Medicine Grand Rounds",
        description: "Weekly grand rounds for internal medicine department",
        date: yesterday,
        startTime: "10:00",
        endTime: "12:00",
        faculty: facultyResult.insertedIds[3], // Dr. John Smith
        department: departmentResult.insertedIds[4], // Internal Medicine
        hospital: hospitalResult.insertedIds[0], // City General Hospital
        location: "Auditorium, Main Building",
        coordinates: {
          latitude: 40.7128,
          longitude: -74.006,
        },
        radius: 100,
        enableGeolocation: true,
        enableQRCode: true,
        qrCodeSecret: crypto.randomBytes(32).toString("hex"),
        qrCodeExpiry: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000),
        year: 7,
        status: "completed",
        createdAt: new Date(yesterday.getTime() - 48 * 60 * 60 * 1000),
        updatedAt: new Date(yesterday.getTime() + 2 * 60 * 60 * 1000),
      },
    ]

    const sessionResult = await db.collection("sessions").insertMany(sessions)
    console.log(`${sessionResult.insertedCount} sessions created`)

    // Create sample attendance records for the completed session
    const completedSession = sessions[3]
    const studentsInInternalMedicine = studentUsers.filter(
      (student) => student.department.toString() === departmentResult.insertedIds[4].toString() && student.year === 7,
    )

    const attendanceRecords = studentsInInternalMedicine.map((student) => {
      const checkInTime = new Date(yesterday.getTime() + 10 * 60 * 60 * 1000) // 10 AM
      const checkOutTime = Math.random() > 0.3 ? new Date(yesterday.getTime() + 12 * 60 * 60 * 1000) : null // 12 PM
      const verificationMethod = Math.random() > 0.5 ? "qrcode" : "geolocation"
      const verifiedBy = completedSession.faculty
      const notes = Math.random() > 0.7 ? "Student participated actively" : ""

      return {
        session: sessionResult.insertedIds[3], // Internal Medicine Grand Rounds
        student: student._id,
        status: Math.random() > 0.2 ? (Math.random() > 0.3 ? "present" : "late") : "absent",
        checkInTime: checkInTime,
        checkOutTime: checkOutTime,
        verificationMethod: verificationMethod,
        verifiedBy: verifiedBy,
        notes: notes,
        createdAt: new Date(yesterday.getTime() + 10 * 60 * 60 * 1000),
        updatedAt: new Date(yesterday.getTime() + 10 * 60 * 60 * 1000),
      }
    })

    await db.collection("attendance").insertMany(attendanceRecords)
    console.log(`${attendanceRecords.length} attendance records created`)

    console.log("Database seed completed successfully!")
  } catch (error) {
    console.error("Error seeding database:", error)
  } finally {
    await client.close()
  }
}

seed().catch(console.error)

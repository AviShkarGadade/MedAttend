"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Hospital, Mail, Lock, User, AlertCircle, BookOpen, Building } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
// Import Firebase modules individually to avoid webpack issues
import { initializeApp } from "firebase/app"
import { getAuth, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth"

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const googleProvider = new GoogleAuthProvider()

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("")
  const [studentId, setStudentId] = useState("")
  const [facultyId, setFacultyId] = useState("")
  const [department, setDepartment] = useState("")
  const [year, setYear] = useState("")
  const [hospital, setHospital] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Mock departments, years, and hospitals for dropdown
  const departments = [
    { id: "dept1", name: "Cardiology" },
    { id: "dept2", name: "Neurology" },
    { id: "dept3", name: "Pediatrics" },
    { id: "dept4", name: "Surgery" },
    { id: "dept5", name: "Internal Medicine" },
    { id: "dept6", name: "Emergency Medicine" },
  ]

  const years = [3, 4, 5]

  const hospitals = [
    { id: "hosp1", name: "City General Hospital" },
    { id: "hosp2", name: "University Hospital" },
    { id: "hosp3", name: "Children's Medical Center" },
    { id: "hosp4", name: "Riverside Medical Center" },
    { id: "hosp5", name: "Memorial Hospital" },
  ]

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!role) {
      setError("Please select a role")
      return
    }

    if (role === "student" && (!studentId || !department || !year)) {
      setError("Please fill in all required student information")
      return
    }

    if (role === "faculty" && (!facultyId || !department || !hospital)) {
      setError("Please fill in all required faculty information")
      return
    }

    setLoading(true)
    setError("")

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const idToken = await userCredential.user.getIdToken()

      // Prepare user data based on role
      const userData = {
        token: idToken,
        name,
        email,
        role,
      }

      if (role === "student") {
        Object.assign(userData, {
          studentId,
          department,
          year: Number.parseInt(year),
        })
      } else if (role === "faculty") {
        Object.assign(userData, {
          facultyId,
          department,
          hospital,
        })
      }

      // Call backend to create user profile with role
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (response.ok) {
        // Redirect to appropriate dashboard based on role
        switch (role) {
          case "student":
            router.push("/student/dashboard")
            break
          case "faculty":
            // Faculty accounts need admin approval
            router.push("/pending-approval")
            break
          default:
            router.push("/profile/setup")
        }
      } else {
        setError(data.message || "Failed to create account")
      }
    } catch (err: any) {
      setError(err.message || "Failed to register")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleRegister = async () => {
    if (!role) {
      setError("Please select a role before continuing with Google")
      return
    }

    if (role === "student" && (!studentId || !department || !year)) {
      setError("Please fill in all required student information before continuing with Google")
      return
    }

    if (role === "faculty" && (!facultyId || !department || !hospital)) {
      setError("Please fill in all required faculty information before continuing with Google")
      return
    }

    setLoading(true)
    setError("")

    try {
      const result = await signInWithPopup(auth, googleProvider)
      const idToken = await result.user.getIdToken()

      // Prepare user data based on role
      const userData = {
        token: idToken,
        name: result.user.displayName || name,
        email: result.user.email,
        role,
      }

      if (role === "student") {
        Object.assign(userData, {
          studentId,
          department,
          year: Number.parseInt(year),
        })
      } else if (role === "faculty") {
        Object.assign(userData, {
          facultyId,
          department,
          hospital,
        })
      }

      // Call backend to create user profile with role
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (response.ok) {
        // Redirect to appropriate dashboard based on role
        switch (role) {
          case "student":
            router.push("/student/dashboard")
            break
          case "faculty":
            // Faculty accounts need admin approval
            router.push("/pending-approval")
            break
          default:
            router.push("/profile/setup")
        }
      } else {
        setError(data.message || "Failed to create account")
      }
    } catch (err: any) {
      setError(err.message || "Failed to register with Google")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <Hospital className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Create an account</CardTitle>
          <CardDescription>Enter your information to create your MedAttend account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleEmailRegister}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="Dr. Jane Smith"
                    className="pl-10"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="jane.smith@hospital.org"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={setRole} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Medical Intern/Student</SelectItem>
                    <SelectItem value="faculty">Faculty/Supervisor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {role === "student" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="studentId">Student ID</Label>
                    <div className="relative">
                      <BookOpen className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="studentId"
                        placeholder="MED2023XXX"
                        className="pl-10"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select value={department} onValueChange={setDepartment} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.name}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Select value={year} onValueChange={setYear} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((y) => (
                          <SelectItem key={y} value={y.toString()}>
                            Year {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {role === "faculty" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="facultyId">Faculty ID</Label>
                    <div className="relative">
                      <BookOpen className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="facultyId"
                        placeholder="FAC2023XXX"
                        className="pl-10"
                        value={facultyId}
                        onChange={(e) => setFacultyId(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select value={department} onValueChange={setDepartment} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.name}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hospital">Hospital</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Select value={hospital} onValueChange={setHospital} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select hospital" />
                        </SelectTrigger>
                        <SelectContent>
                          {hospitals.map((h) => (
                            <SelectItem key={h.id} value={h.name}>
                              {h.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}

              <p className="text-xs text-muted-foreground">
                Note: Faculty accounts require admin approval before activation.
              </p>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account..." : "Create Account"}
              </Button>
            </div>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button variant="outline" type="button" className="w-full" onClick={handleGoogleRegister} disabled={loading}>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </Button>
        </CardContent>
        <CardFooter className="text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}


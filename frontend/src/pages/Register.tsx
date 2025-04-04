"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { signUpWithEmail, signInWithGoogle, getIdToken } from "../services/firebase"
import { authService, departmentService, hospitalService } from "../services/api"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Alert,
  AlertDescription,
} from "../components/ui"
import { Hospital, Mail, Lock, User, AlertCircle, BookOpen, Building } from "lucide-react"

interface Department {
  _id: string
  name: string
}

interface HospitalType {
  _id: string
  name: string
}

const Register: React.FC = () => {
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
  const [departments, setDepartments] = useState<Department[]>([])
  const [hospitals, setHospitals] = useState<HospitalType[]>([])
  const navigate = useNavigate()

  // Fetch departments and hospitals
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deptResponse, hospResponse] = await Promise.all([
          departmentService.getDepartments(),
          hospitalService.getHospitals(),
        ])
        setDepartments(deptResponse.data)
        setHospitals(hospResponse.data)
      } catch (err: any) {
        console.error("Error fetching data:", err)
        setError("Failed to load departments and hospitals")
      }
    }

    fetchData()
  }, [])

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
      // Create user in Firebase
      const firebaseUser = await signUpWithEmail(email, password)

      // Get ID token
      const token = await getIdToken(firebaseUser)

      // Prepare user data based on role
      const userData = {
        token,
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

      // Register user with backend
      const response = await authService.register(userData)

      // Redirect based on role
      if (response.role === "student") {
        navigate("/login", { state: { message: "Registration successful. Please login." } })
      } else if (response.role === "faculty") {
        navigate("/pending-approval")
      } else {
        navigate("/login", { state: { message: "Registration successful. Please login." } })
      }
    } catch (err: any) {
      setError(err.message || "Failed to register")
      console.error("Registration error:", err)
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
      // Sign in with Google
      const firebaseUser = await signInWithGoogle()

      // Get ID token
      const token = await getIdToken(firebaseUser)

      // Prepare user data based on role
      const userData = {
        token,
        name: firebaseUser.displayName || name,
        email: firebaseUser.email,
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

      // Register user with backend
      const response = await authService.register(userData)

      // Redirect based on role
      if (response.role === "student") {
        navigate("/login", { state: { message: "Registration successful. Please login." } })
      } else if (response.role === "faculty") {
        navigate("/pending-approval")
      } else {
        navigate("/login", { state: { message: "Registration successful. Please login." } })
      }
    } catch (err: any) {
      setError(err.message || "Failed to register with Google")
      console.error("Google registration error:", err)
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
                          <SelectItem key={dept._id} value={dept.name}>
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
                        {[3, 4, 5, 6, 7].map((y) => (
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
                          <SelectItem key={dept._id} value={dept.name}>
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
                            <SelectItem key={h._id} value={h.name}>
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
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

export default Register


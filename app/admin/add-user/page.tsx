"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AdminDashboardHeader } from "@/components/admin-dashboard-header"
import { userService, departmentService, hospitalService } from "@/services/api"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { AlertCircle, CheckCircle2 } from "lucide-react"

export default function AddUserPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form fields
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("")
  const [department, setDepartment] = useState("")
  const [hospital, setHospital] = useState("")
  const [studentId, setStudentId] = useState("")
  const [facultyId, setFacultyId] = useState("")
  const [year, setYear] = useState("")

  // Options for dropdowns
  const [departments, setDepartments] = useState<any[]>([])
  const [hospitals, setHospitals] = useState<any[]>([])

  const router = useRouter()

  useEffect(() => {
    const auth = getAuth()

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user)

        try {
          // Fetch departments and hospitals for dropdowns
          const [deptResponse, hospResponse] = await Promise.all([
            departmentService.getDepartments(),
            hospitalService.getHospitals(),
          ])

          setDepartments(deptResponse.data)
          setHospitals(hospResponse.data)
        } catch (error) {
          console.error("Error fetching data:", error)
          setError("Failed to load form data")
        } finally {
          setLoading(false)
        }
      } else {
        // User is not logged in
        router.push("/login")
      }
    })

    // Cleanup subscription
    return () => unsubscribe()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSubmitting(true)
      setError(null)

      // Validate form
      if (!name || !email || !password || !role) {
        setError("Please fill in all required fields")
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

      // Prepare user data
      const userData: any = {
        name,
        email,
        password,
        role,
      }

      if (role === "student") {
        userData.studentId = studentId
        userData.department = department
        userData.year = Number.parseInt(year)
      } else if (role === "faculty") {
        userData.facultyId = facultyId
        userData.department = department
        userData.hospital = hospital
        userData.isApproved = true // Admin-created faculty are auto-approved
      }

      // Create user
      await userService.createUser(userData)

      // Show success message
      setSuccess("User created successfully")

      // Reset form
      setName("")
      setEmail("")
      setPassword("")
      setRole("")
      setDepartment("")
      setHospital("")
      setStudentId("")
      setFacultyId("")
      setYear("")

      // Redirect after a delay
      setTimeout(() => {
        router.push("/admin/users")
      }, 2000)
    } catch (err: any) {
      setError(err.message || "Failed to create user")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminDashboardHeader user={user} />

      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Add New User</h1>
            <p className="text-muted-foreground">Create a new student or faculty account</p>
          </div>
          <Button variant="outline" onClick={() => router.push("/admin/users")}>
            Cancel
          </Button>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>User Information</CardTitle>
            <CardDescription>Enter the details for the new user account</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-6 bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-700">{success}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john.doe@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={role} onValueChange={setRole} required>
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="faculty">Faculty</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {role === "student" && (
                  <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="studentId">Student ID</Label>
                        <Input
                          id="studentId"
                          placeholder="MED2023XXX"
                          value={studentId}
                          onChange={(e) => setStudentId(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="year">Year</Label>
                        <Select value={year} onValueChange={setYear} required>
                          <SelectTrigger id="year">
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
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Select value={department} onValueChange={setDepartment} required>
                        <SelectTrigger id="department">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept._id} value={dept._id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {role === "faculty" && (
                  <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="facultyId">Faculty ID</Label>
                        <Input
                          id="facultyId"
                          placeholder="FAC2023XXX"
                          value={facultyId}
                          onChange={(e) => setFacultyId(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="department">Department</Label>
                        <Select value={department} onValueChange={setDepartment} required>
                          <SelectTrigger id="department">
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map((dept) => (
                              <SelectItem key={dept._id} value={dept._id}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="hospital">Hospital</Label>
                      <Select value={hospital} onValueChange={setHospital} required>
                        <SelectTrigger id="hospital">
                          <SelectValue placeholder="Select hospital" />
                        </SelectTrigger>
                        <SelectContent>
                          {hospitals.map((hosp) => (
                            <SelectItem key={hosp._id} value={hosp._id}>
                              {hosp.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>

              <CardFooter className="px-0 pt-4">
                <Button type="submit" className="ml-auto" disabled={submitting}>
                  {submitting ? "Creating..." : "Create User"}
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}


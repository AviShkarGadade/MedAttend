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
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import ProtectedRoute from "@/components/protected-route"

export default function AddUserPage() {
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
  const [facultyId, setFacultyId] = useState("")
  const [year, setYear] = useState("")

  // Options for dropdowns
  const [departments, setDepartments] = useState<any[]>([])
  const [hospitals, setHospitals] = useState<any[]>([])

  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch departments and hospitals
        const token = localStorage.getItem("authToken")
        if (!token) {
          throw new Error("No authentication token found")
        }

        // Fetch departments
        const deptResponse = await fetch("/api/departments", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        // Fetch hospitals
        const hospResponse = await fetch("/api/hospitals", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (deptResponse.ok) {
          const deptData = await deptResponse.json()
          setDepartments(deptData.data || [])
        } else {
          console.error("Failed to fetch departments")
          // Use mock data as fallback
          setDepartments([
            { _id: "dept1", name: "Cardiology" },
            { _id: "dept2", name: "Neurology" },
            { _id: "dept3", name: "Pediatrics" },
            { _id: "dept4", name: "Surgery" },
            { _id: "dept5", name: "Internal Medicine" },
          ])
        }

        if (hospResponse.ok) {
          const hospData = await hospResponse.json()
          setHospitals(hospData.data || [])
        } else {
          console.error("Failed to fetch hospitals")
          // Use mock data as fallback
          setHospitals([
            { _id: "hosp1", name: "City General Hospital" },
            { _id: "hosp2", name: "University Hospital" },
            { _id: "hosp3", name: "Children's Medical Center" },
            { _id: "hosp4", name: "Riverside Medical Center" },
            { _id: "hosp5", name: "Memorial Hospital" },
          ])
        }
      } catch (error: any) {
        console.error("Error fetching data:", error)
        setError("Failed to load form data")

        // Use mock data as fallback
        setDepartments([
          { _id: "dept1", name: "Cardiology" },
          { _id: "dept2", name: "Neurology" },
          { _id: "dept3", name: "Pediatrics" },
          { _id: "dept4", name: "Surgery" },
          { _id: "dept5", name: "Internal Medicine" },
        ])

        setHospitals([
          { _id: "hosp1", name: "City General Hospital" },
          { _id: "hosp2", name: "University Hospital" },
          { _id: "hosp3", name: "Children's Medical Center" },
          { _id: "hosp4", name: "Riverside Medical Center" },
          { _id: "hosp5", name: "Memorial Hospital" },
        ])
      } finally {
        setLoading(false)
      }
    }

    if (user && user.role === "admin") {
      fetchData()
    }
  }, [user])

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

      if (role === "faculty" && (!facultyId || !department || !hospital)) {
        setError("Please fill in all required faculty information")
        return
      }

      // Get ID token for authentication
      const token = localStorage.getItem("authToken")
      if (!token) {
        setError("Authentication error. Please try again.")
        return
      }

      // Prepare user data
      const userData: any = {
        token,
        name,
        email,
        password,
        role,
      }

      if (role === "faculty") {
        userData.facultyId = facultyId
        userData.department = department
        userData.hospital = hospital
      }

      // Create user
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      })

      if (response.ok) {
        // Show success message
        setSuccess("User created successfully")

        // Reset form
        setName("")
        setEmail("")
        setPassword("")
        setRole("")
        setDepartment("")
        setHospital("")
        setFacultyId("")
        setYear("")

        // Redirect after a delay
        setTimeout(() => {
          router.push("/admin/users")
        }, 2000)
      } else {
        const data = await response.json()
        setError(data.message || "Failed to create user")
      }
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
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="min-h-screen bg-background">
        <AdminDashboardHeader user={user} />

        <main className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold">Add New Faculty</h1>
              <p className="text-muted-foreground">Create a new faculty account</p>
            </div>
            <Button variant="outline" onClick={() => router.push("/admin/users")}>
              Cancel
            </Button>
          </div>

          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Faculty Information</CardTitle>
              <CardDescription>Enter the details for the new faculty account</CardDescription>
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
                        placeholder="Dr. Jane Smith"
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
                        placeholder="jane.smith@example.com"
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
                      <Select value="faculty" onValueChange={setRole} required>
                        <SelectTrigger id="role">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="faculty">Faculty</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

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
                </div>

                <CardFooter className="px-0 pt-4">
                  <Button type="submit" className="ml-auto" disabled={submitting}>
                    {submitting ? "Creating..." : "Create Faculty"}
                  </Button>
                </CardFooter>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  )
}


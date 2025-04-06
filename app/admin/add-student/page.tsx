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
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { AlertCircle, CheckCircle2 } from "lucide-react"

export default function AddStudentPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form fields
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [studentId, setStudentId] = useState("")
  const [department, setDepartment] = useState("")
  const [year, setYear] = useState("")

  // Options for dropdowns
  const [departments, setDepartments] = useState<any[]>([])

  const router = useRouter()

  useEffect(() => {
    const auth = getAuth()

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user)

        try {
          // Fetch departments for dropdowns
          const response = await fetch("/api/departments")
          if (response.ok) {
            const data = await response.json()
            setDepartments(data.data)
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
        } catch (error) {
          console.error("Error fetching data:", error)
          // Use mock data as fallback
          setDepartments([
            { _id: "dept1", name: "Cardiology" },
            { _id: "dept2", name: "Neurology" },
            { _id: "dept3", name: "Pediatrics" },
            { _id: "dept4", name: "Surgery" },
            { _id: "dept5", name: "Internal Medicine" },
          ])
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
      if (!name || !email || !password || !studentId || !department || !year) {
        setError("Please fill in all required fields")
        return
      }

      // Get ID token for authentication
      const auth = getAuth()
      const idToken = await auth.currentUser?.getIdToken()

      if (!idToken) {
        setError("Authentication error. Please try again.")
        return
      }

      // Prepare student data
      const studentData = {
        token: idToken,
        name,
        email,
        password,
        role: "student",
        studentId,
        department,
        year: Number.parseInt(year),
      }

      // Create student
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(studentData),
      })

      if (response.ok) {
        // Show success message
        setSuccess("Student created successfully")

        // Reset form
        setName("")
        setEmail("")
        setPassword("")
        setStudentId("")
        setDepartment("")
        setYear("")

        // Redirect after a delay
        setTimeout(() => {
          router.push("/admin/users")
        }, 2000)
      } else {
        const data = await response.json()
        setError(data.message || "Failed to create student")
      }
    } catch (err: any) {
      setError(err.message || "Failed to create student")
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
            <h1 className="text-2xl font-bold">Add New Student</h1>
            <p className="text-muted-foreground">Create a new student account</p>
          </div>
          <Button variant="outline" onClick={() => router.push("/admin/users")}>
            Cancel
          </Button>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
            <CardDescription>Enter the details for the new student account</CardDescription>
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
                    <Label htmlFor="studentId">Student ID</Label>
                    <Input
                      id="studentId"
                      placeholder="MED2023XXX"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              </div>

              <CardFooter className="px-0 pt-4">
                <Button type="submit" className="ml-auto" disabled={submitting}>
                  {submitting ? "Creating..." : "Create Student"}
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}


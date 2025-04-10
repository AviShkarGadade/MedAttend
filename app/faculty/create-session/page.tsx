"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { FacultyDashboardHeader } from "@/components/faculty-dashboard-header"
import { CalendarIcon, Clock, MapPin, Info, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/components/auth-provider"
import ProtectedRoute from "@/components/protected-route"

export default function CreateSessionPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("11:00")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [hospital, setHospital] = useState("")
  const [department, setDepartment] = useState("")
  const [year, setYear] = useState("")
  const [enableGeolocation, setEnableGeolocation] = useState(true)
  const [enableQRCode, setEnableQRCode] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [hospitals, setHospitals] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])

  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("authToken")
        if (!token) {
          throw new Error("No authentication token found")
        }

        // Fetch hospitals
        const hospitalsResponse = await fetch("/api/hospitals", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        // Fetch departments
        const departmentsResponse = await fetch("/api/departments", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (hospitalsResponse.ok) {
          const hospitalsData = await hospitalsResponse.json()
          setHospitals(hospitalsData.data || [])

          // Set default hospital if user has one
          if (user && user.hospital) {
            const userHospital = hospitalsData.data.find((h: any) => h.name === user.hospital)
            if (userHospital) {
              setHospital(userHospital._id)
            }
          }
        } else {
          console.error("Failed to fetch hospitals")
        }

        if (departmentsResponse.ok) {
          const departmentsData = await departmentsResponse.json()
          setDepartments(departmentsData.data || [])

          // Set default department if user has one
          if (user && user.department) {
            const userDepartment = departmentsData.data.find((d: any) => d.name === user.department)
            if (userDepartment) {
              setDepartment(userDepartment._id)
            }
          }
        } else {
          console.error("Failed to fetch departments")
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      }
    }

    fetchData()
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (!date || !startTime || !endTime || !title || !location || !hospital || !department || !year) {
        setError("Please fill in all required fields")
        return
      }

      const token = localStorage.getItem("authToken")
      if (!token) {
        throw new Error("No authentication token found")
      }

      // Format date as ISO string (YYYY-MM-DD)
      const formattedDate = date.toISOString().split("T")[0]

      // Create session data
      const sessionData = {
        title,
        description,
        date: formattedDate,
        startTime,
        endTime,
        department,
        hospital,
        location,
        year: Number.parseInt(year),
        enableGeolocation,
        enableQRCode,
        status: "active", // Set as active by default
        coordinates: {
          latitude: 40.7128, // Default coordinates (NYC)
          longitude: -74.006,
        },
      }

      // Create session
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(sessionData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create session")
      }

      setSuccess("Session created successfully")

      // Redirect to faculty dashboard after a delay
      setTimeout(() => {
        router.push("/faculty/dashboard")
      }, 1500)
    } catch (error: any) {
      console.error("Error creating session:", error)
      setError(error.message || "Failed to create session")
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={["faculty"]}>
      <div className="min-h-screen bg-background">
        <FacultyDashboardHeader user={user} />

        <main className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold">Create Attendance Session</h1>
              <p className="text-muted-foreground">Set up a new attendance tracking session</p>
            </div>
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 bg-green-50 border-green-200">
              <AlertCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700">{success}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Session Details</CardTitle>
                  <CardDescription>Basic information about the attendance session</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Session Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Morning Rounds - Cardiology"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Brief description of the session"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                        </PopoverContent>
                      </Popover>
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

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Start Time</Label>
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="startTime"
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endTime">End Time</Label>
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="endTime"
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="year">Student Year</Label>
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Location & Verification</CardTitle>
                  <CardDescription>
                    Where the session will take place and attendance verification methods
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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

                  <div className="space-y-2">
                    <Label htmlFor="location">Specific Location</Label>
                    <div className="flex items-center">
                      <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="location"
                        placeholder="e.g., Cardiology Wing, Room 302"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <h3 className="text-sm font-medium mb-3">Verification Methods</h3>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="geolocation">Geolocation Verification</Label>
                          <p className="text-sm text-muted-foreground">Verify student's physical presence using GPS</p>
                        </div>
                        <Switch id="geolocation" checked={enableGeolocation} onCheckedChange={setEnableGeolocation} />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="qrcode">QR Code Verification</Label>
                          <p className="text-sm text-muted-foreground">Generate QR code for students to scan</p>
                        </div>
                        <Switch id="qrcode" checked={enableQRCode} onCheckedChange={setEnableQRCode} />
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted p-3 rounded-lg flex items-start mt-4">
                    <Info className="h-5 w-5 text-muted-foreground mr-2 mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      Students will need to be within 100 meters of the specified location to mark attendance if
                      geolocation is enabled.
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button type="submit" disabled={loading}>
                    {loading ? "Creating..." : "Create Session"}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </form>
        </main>
      </div>
    </ProtectedRoute>
  )
}

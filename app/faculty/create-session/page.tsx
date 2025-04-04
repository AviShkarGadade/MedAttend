"use client"

import type React from "react"

import { useState } from "react"
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
import { CalendarIcon, Clock, MapPin, Info } from "lucide-react"
import { format } from "date-fns"

export default function CreateSessionPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("11:00")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [hospital, setHospital] = useState("")
  const [department, setDepartment] = useState("")
  const [enableGeolocation, setEnableGeolocation] = useState(true)
  const [enableQRCode, setEnableQRCode] = useState(true)
  const [loading, setLoading] = useState(false)

  const router = useRouter()

  // Mock user data for demonstration
  const mockUser = {
    name: "Dr. Sarah Williams",
    id: "FAC2023012",
    department: "Cardiology",
    hospital: "City General Hospital",
  }

  // Mock hospitals and departments for dropdown
  const hospitals = [
    { id: "hosp1", name: "City General Hospital" },
    { id: "hosp2", name: "University Hospital" },
    { id: "hosp3", name: "Children's Medical Center" },
    { id: "hosp4", name: "Riverside Medical Center" },
    { id: "hosp5", name: "Memorial Hospital" },
  ]

  const departments = [
    { id: "dept1", name: "Cardiology" },
    { id: "dept2", name: "Neurology" },
    { id: "dept3", name: "Pediatrics" },
    { id: "dept4", name: "Surgery" },
    { id: "dept5", name: "Internal Medicine" },
    { id: "dept6", name: "Emergency Medicine" },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // In a real application, this would call an API endpoint
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Redirect to faculty dashboard
      router.push("/faculty/dashboard")
    } catch (error) {
      console.error("Error creating session:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <FacultyDashboardHeader user={mockUser} />

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
                          <SelectItem key={dept.id} value={dept.id}>
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Location & Verification</CardTitle>
                <CardDescription>Where the session will take place and attendance verification methods</CardDescription>
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
                        <SelectItem key={hosp.id} value={hosp.id}>
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
  )
}


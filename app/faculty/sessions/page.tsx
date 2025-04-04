"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Clock, MapPin, Users, QrCode, Plus, Search, Filter } from "lucide-react"
import { FacultyDashboardHeader } from "@/components/faculty-dashboard-header"
import { getAuth, onAuthStateChanged } from "firebase/auth"

export default function FacultySessions() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("active")
  const [searchQuery, setSearchQuery] = useState("")
  const [dateFilter, setDateFilter] = useState("all")
  const [showQRCode, setShowQRCode] = useState(false)
  const [selectedSession, setSelectedSession] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const auth = getAuth()

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user)
        // In a real app, we would fetch faculty data here
        setLoading(false)
      } else {
        // User is not logged in
        router.push("/login")
      }
    })

    // Cleanup subscription
    return () => unsubscribe()
  }, [router])

  // Mock faculty user for demonstration
  const mockFaculty = {
    name: "Dr. Sarah Williams",
    id: "FAC2023012",
    department: "Cardiology",
    hospital: "City General Hospital",
  }

  // Mock sessions data for demonstration
  const mockSessions = [
    {
      id: "sess001",
      title: "Morning Rounds - Cardiology",
      date: "2025-04-02",
      startTime: "08:00",
      endTime: "10:00",
      location: "City General Hospital - Cardiology Wing",
      department: "Cardiology",
      totalStudents: 12,
      presentStudents: 10,
      status: "active",
    },
    {
      id: "sess002",
      title: "Clinical Skills Workshop",
      date: "2025-04-02",
      startTime: "13:00",
      endTime: "15:00",
      location: "City General Hospital - Training Room B",
      department: "Cardiology",
      totalStudents: 8,
      presentStudents: 0,
      status: "upcoming",
    },
    {
      id: "sess003",
      title: "Morning Rounds - Cardiology",
      date: "2025-04-03",
      startTime: "08:00",
      endTime: "10:00",
      location: "City General Hospital - Cardiology Wing",
      department: "Cardiology",
      totalStudents: 12,
      presentStudents: 0,
      status: "upcoming",
    },
    {
      id: "sess004",
      title: "Case Presentation Session",
      date: "2025-04-03",
      startTime: "14:00",
      endTime: "16:00",
      location: "City General Hospital - Conference Room A",
      department: "Cardiology",
      totalStudents: 15,
      presentStudents: 0,
      status: "upcoming",
    },
    {
      id: "sess005",
      title: "Morning Rounds - Cardiology",
      date: "2025-04-01",
      startTime: "08:00",
      endTime: "10:00",
      location: "City General Hospital - Cardiology Wing",
      department: "Cardiology",
      totalStudents: 12,
      presentStudents: 11,
      status: "completed",
    },
  ]

  // Mock attendance data for a session
  const mockAttendance = [
    {
      id: "att001",
      studentId: "MED2023045",
      studentName: "Alex Johnson",
      department: "Cardiology",
      year: 3,
      status: "present",
      checkInTime: "07:55",
      checkOutTime: "10:05",
    },
    {
      id: "att002",
      studentId: "MED2023046",
      studentName: "Maria Garcia",
      department: "Cardiology",
      year: 3,
      status: "present",
      checkInTime: "07:50",
      checkOutTime: "10:00",
    },
    {
      id: "att003",
      studentId: "MED2023047",
      studentName: "James Wilson",
      department: "Cardiology",
      year: 3,
      status: "late",
      checkInTime: "08:20",
      checkOutTime: "10:10",
    },
    {
      id: "att004",
      studentId: "MED2023048",
      studentName: "Emily Chen",
      department: "Cardiology",
      year: 3,
      status: "present",
      checkInTime: "07:45",
      checkOutTime: "10:05",
    },
    {
      id: "att005",
      studentId: "MED2023049",
      studentName: "David Kim",
      department: "Cardiology",
      year: 3,
      status: "absent",
      checkInTime: null,
      checkOutTime: null,
    },
  ]

  const filteredSessions = mockSessions.filter((session) => {
    const matchesSearch =
      session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.location.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesTab =
      (activeTab === "active" && session.status === "active") ||
      (activeTab === "upcoming" && session.status === "upcoming") ||
      (activeTab === "completed" && session.status === "completed")

    const matchesDate = dateFilter === "all" || session.date === dateFilter

    // Only show sessions for the faculty's department
    const matchesDepartment = session.department === mockFaculty.department

    return matchesSearch && matchesTab && matchesDate && matchesDepartment
  })

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <FacultyDashboardHeader user={mockFaculty} />

      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Attendance Sessions</h1>
            <p className="text-muted-foreground">Manage and track attendance sessions for {mockFaculty.department}</p>
          </div>
          <Button onClick={() => router.push("/faculty/create-session")}>
            <Plus className="h-4 w-4 mr-2" />
            Create Session
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search sessions..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dates</SelectItem>
                    <SelectItem value="2025-04-01">April 1, 2025</SelectItem>
                    <SelectItem value="2025-04-02">April 2, 2025</SelectItem>
                    <SelectItem value="2025-04-03">April 3, 2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              {filteredSessions.length > 0 ? (
                filteredSessions.map((session) => (
                  <Card key={session.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="p-4 border-l-4 border-primary">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div>
                            <h3 className="font-medium text-lg">{session.title}</h3>
                            <div className="flex flex-wrap gap-4 mt-2 text-sm">
                              <div className="flex items-center text-muted-foreground">
                                <CalendarIcon className="h-4 w-4 mr-1" />
                                {new Date(session.date).toLocaleDateString(undefined, {
                                  weekday: "long",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </div>
                              <div className="flex items-center text-muted-foreground">
                                <Clock className="h-4 w-4 mr-1" />
                                {session.startTime} - {session.endTime}
                              </div>
                              <div className="flex items-center text-muted-foreground">
                                <MapPin className="h-4 w-4 mr-1" />
                                {session.location}
                              </div>
                            </div>

                            <div className="flex items-center mt-3">
                              <Badge
                                className={
                                  session.status === "active"
                                    ? "bg-green-500"
                                    : session.status === "upcoming"
                                      ? "bg-blue-500"
                                      : "bg-gray-500"
                                }
                              >
                                {session.status === "active"
                                  ? "Active"
                                  : session.status === "upcoming"
                                    ? "Upcoming"
                                    : "Completed"}
                              </Badge>
                              <div className="ml-4 flex items-center text-sm">
                                <Users className="h-4 w-4 mr-1" />
                                <span>
                                  {session.presentStudents} / {session.totalStudents} students present
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {session.status === "active" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedSession(session)
                                    setShowQRCode(true)
                                  }}
                                >
                                  <QrCode className="h-4 w-4 mr-2" />
                                  QR Code
                                </Button>
                                <Button size="sm" onClick={() => router.push(`/faculty/sessions/${session.id}`)}>
                                  Take Attendance
                                </Button>
                              </>
                            )}

                            {session.status === "upcoming" && (
                              <>
                                <Button variant="outline" size="sm">
                                  Edit
                                </Button>
                                <Button size="sm" onClick={() => router.push(`/faculty/sessions/${session.id}`)}>
                                  Details
                                </Button>
                              </>
                            )}

                            {session.status === "completed" && (
                              <Button size="sm" onClick={() => router.push(`/faculty/sessions/${session.id}`)}>
                                View Report
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">No sessions found matching your filters</div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* QR Code Dialog */}
      {showQRCode && selectedSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Attendance QR Code</CardTitle>
              <CardDescription>Students can scan this QR code to mark their attendance</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-lg mb-4">
                <div className="w-64 h-64 bg-[url('/placeholder.svg?height=256&width=256')] bg-contain bg-no-repeat bg-center" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-medium">{selectedSession.title}</p>
                <p className="text-sm text-muted-foreground">Valid for the next 10 minutes</p>
                <p className="text-sm text-muted-foreground">Session ID: {selectedSession.id.toUpperCase()}</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setShowQRCode(false)}>
                Close
              </Button>
              <Button>Refresh Code</Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  )
}


"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import { sessionService, userService } from "../../services/api"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui"
import { FacultyDashboardHeader } from "../../components/faculty/FacultyDashboardHeader"
import { QRCodeDisplay } from "../../components/faculty/QRCodeDisplay"
import { CalendarIcon, Clock, MapPin, Users, QrCode, BarChart3, Plus, Search, Download } from "lucide-react"

const FacultyDashboard: React.FC = () => {
  const { currentUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentSessions, setCurrentSessions] = useState<any[]>([])
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [showQRCode, setShowQRCode] = useState(false)
  const [selectedSession, setSelectedSession] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [yearFilter, setYearFilter] = useState("all")
  const navigate = useNavigate()

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)

        // Fetch active sessions
        const activeSessions = await sessionService.getSessions({
          status: "active",
        })
        setCurrentSessions(activeSessions.data)

        // Fetch upcoming sessions
        const upcomingSessions = await sessionService.getSessions({
          status: "upcoming",
          limit: 5,
        })
        setUpcomingSessions(upcomingSessions.data)

        // Fetch students in faculty's department
        const studentsResponse = await userService.getUsers({
          role: "student",
          department: currentUser.department,
        })
        setStudents(studentsResponse.data)
      } catch (err: any) {
        console.error("Error fetching dashboard data:", err)
        setError("Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [currentUser])

  const handleGenerateQRCode = async (session: any) => {
    try {
      const response = await sessionService.generateQRCode(session._id)
      setSelectedSession({
        ...session,
        qrCode: response.data.qrCode,
        qrCodeExpiry: response.data.expiry,
      })
      setShowQRCode(true)
    } catch (err: any) {
      console.error("Error generating QR code:", err)
      setError("Failed to generate QR code")
    }
  }

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesYear = yearFilter === "all" || student.year.toString() === yearFilter

    return matchesSearch && matchesYear
  })

  const getAttendanceRateBadge = (rate: number) => {
    if (rate >= 90) {
      return <Badge className="bg-green-500">{rate}%</Badge>
    } else if (rate >= 75) {
      return <Badge className="bg-yellow-500">{rate}%</Badge>
    } else {
      return <Badge className="bg-red-500">{rate}%</Badge>
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <FacultyDashboardHeader user={currentUser} />

      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Faculty Dashboard</h1>
            <p className="text-muted-foreground">Manage attendance and monitor student progress</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/faculty/create-session")}>
              <Plus className="h-4 w-4 mr-2" />
              Create Session
            </Button>
            <Button variant="outline" onClick={() => navigate("/faculty/reports")}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Reports
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Today's Sessions Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Today's Sessions</CardTitle>
                <CardDescription>Active and upcoming sessions for today</CardDescription>
              </div>
              <CalendarIcon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentSessions.length > 0 ? (
                  currentSessions.map((session) => (
                    <div key={session._id} className="border rounded-lg p-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <h3 className="font-medium">{session.title}</h3>
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <Clock className="h-4 w-4 mr-1" />
                            {session.startTime} - {session.endTime}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <MapPin className="h-4 w-4 mr-1" />
                            {session.location}
                          </div>
                          <div className="flex items-center text-sm mt-2">
                            <Users className="h-4 w-4 mr-1" />
                            <span>
                              {session.attendanceCount || 0} / {session.totalStudents || 0} students present
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleGenerateQRCode(session)}>
                            <QrCode className="h-4 w-4 mr-2" />
                            QR Code
                          </Button>
                          <Button size="sm" onClick={() => navigate(`/faculty/sessions/${session._id}`)}>
                            Take Attendance
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground">No active sessions for today</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Sessions Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Upcoming Sessions</CardTitle>
                <CardDescription>Sessions scheduled for the next few days</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={() => navigate("/faculty/sessions")}>
                <CalendarIcon className="h-4 w-4" />
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingSessions.length > 0 ? (
                  upcomingSessions.map((session) => (
                    <div key={session._id} className="border rounded-lg p-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{session.title}</h3>
                            <Badge variant="outline">
                              {new Date(session.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            </Badge>
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <Clock className="h-4 w-4 mr-1" />
                            {session.startTime} - {session.endTime}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <MapPin className="h-4 w-4 mr-1" />
                            {session.location}
                          </div>
                          <div className="flex items-center text-sm mt-2">
                            <Users className="h-4 w-4 mr-1" />
                            <span>{session.totalStudents || 0} students enrolled</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/faculty/sessions/${session._id}/edit`)}
                          >
                            Edit
                          </Button>
                          <Button size="sm" onClick={() => navigate(`/faculty/sessions/${session._id}`)}>
                            Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground">No upcoming sessions scheduled</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Student Management</CardTitle>
              <CardDescription>View and manage students under your supervision</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search students..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    <SelectItem value="3">Year 3</SelectItem>
                    <SelectItem value="4">Year 4</SelectItem>
                    <SelectItem value="5">Year 5</SelectItem>
                    <SelectItem value="6">Year 6</SelectItem>
                    <SelectItem value="7">Year 7</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="flex gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-12 gap-4 p-4 bg-muted font-medium">
                  <div className="col-span-5">Name</div>
                  <div className="col-span-3">Department</div>
                  <div className="col-span-2">Year</div>
                  <div className="col-span-2">Attendance</div>
                </div>

                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <div key={student._id} className="grid grid-cols-12 gap-4 p-4 border-t">
                      <div className="col-span-5 font-medium">{student.name}</div>
                      <div className="col-span-3 text-muted-foreground">{student.department.name}</div>
                      <div className="col-span-2 text-muted-foreground">Year {student.year}</div>
                      <div className="col-span-2">{getAttendanceRateBadge(student.attendanceRate || 0)}</div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-muted-foreground">No students found</div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" size="sm">
                Previous
              </Button>
              <Button variant="outline" size="sm">
                Next
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* QR Code Modal */}
        {showQRCode && selectedSession && (
          <QRCodeDisplay
            session={selectedSession}
            onClose={() => {
              setShowQRCode(false)
              setSelectedSession(null)
            }}
            onRefresh={() => handleGenerateQRCode(selectedSession)}
          />
        )}
      </main>
    </div>
  )
}

export default FacultyDashboard


"use client"

import { CardFooter } from "@/components/ui/card"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import { sessionService, attendanceService } from "../../services/api"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Progress,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Calendar,
  Alert,
  AlertDescription,
} from "../../components/ui"
import { StudentDashboardHeader } from "../../components/student/StudentDashboardHeader"
import { QRCodeScanner } from "../../components/student/QRCodeScanner"
import { GeolocationAttendance } from "../../components/student/GeolocationAttendance"
import {
  CalendarIcon,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  BarChart3,
  QrCode,
  AlertCircle,
  RefreshCw,
} from "lucide-react"

const StudentDashboard = () => {
  const { currentUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [upcomingSessions, setUpcomingSessions] = useState([])
  const [recentAttendance, setRecentAttendance] = useState([])
  const [attendanceStats, setAttendanceStats] = useState(null)
  const [currentRotation, setCurrentRotation] = useState(null)
  const [showScanner, setShowScanner] = useState(false)
  const [showGeolocation, setShowGeolocation] = useState(false)
  const [selectedSession, setSelectedSession] = useState(null)
  const [date, setDate] = useState(new Date())
  const [activeTab, setActiveTab] = useState("upcoming")
  const [refreshing, setRefreshing] = useState(false)
  const navigate = useNavigate()

  // Function to fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get today's date in ISO format (YYYY-MM-DD)
      const today = new Date().toISOString().split("T")[0]
      console.log("Fetching sessions for today:", today)

      // Fetch active sessions for today
      const activeSessions = await sessionService.getSessions({
        status: "active",
        date: today,
      })

      // Fetch upcoming sessions
      const upcomingSessions = await sessionService.getSessions({
        status: "upcoming",
        limit: 5,
      })

      // Fetch recent attendance
      const attendanceResponse = await attendanceService.getAttendanceHistory({
        limit: 5,
      })

      // Fetch attendance stats
      const statsResponse = await attendanceService.getAttendanceStats({})

      console.log("Active sessions:", activeSessions.data)
      console.log("Upcoming sessions:", upcomingSessions.data)
      console.log("Recent attendance:", attendanceResponse.data)
      console.log("Attendance stats:", statsResponse.data)

      // Combine active and upcoming sessions
      const allSessions = [...(activeSessions.data || []), ...(upcomingSessions.data || [])]

      // Sort sessions by date and time
      allSessions.sort((a, b) => {
        const dateA = new Date(a.date)
        const dateB = new Date(b.date)
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA - dateB
        }
        return a.startTime.localeCompare(b.startTime)
      })

      setUpcomingSessions(allSessions)
      setRecentAttendance(attendanceResponse.data || [])
      setAttendanceStats(
        statsResponse.data || {
          present: 0,
          absent: 0,
          late: 0,
          total: 0,
          presentPercentage: 0,
        },
      )

      // Set current rotation based on user data
      setCurrentRotation({
        hospital: currentUser.hospital || "University Hospital",
        department: currentUser.department?.name || "Cardiology",
        supervisor: "Dr. Sarah Williams",
        startDate: "2025-03-15",
        endDate: "2025-04-15",
      })
    } catch (err) {
      console.error("Error fetching dashboard data:", err)
      setError("Failed to load dashboard data. " + (err.message || "Please try again."))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData()
  }, [currentUser])

  // Handle manual refresh
  const handleRefresh = () => {
    setRefreshing(true)
    fetchDashboardData()
  }

  const handleQRCodeScan = async (data) => {
    try {
      // Parse QR code data
      const qrData = JSON.parse(data)

      // Mark attendance
      await attendanceService.markAttendance({
        sessionId: qrData.sessionId,
        verificationMethod: "qrcode",
        qrCodeData: data,
      })

      // Close scanner and refresh data
      setShowScanner(false)
      fetchDashboardData()
    } catch (err) {
      console.error("Error marking attendance:", err)
      setError("Failed to mark attendance: " + (err.message || "Please try again."))
    }
  }

  const handleGeolocationAttendance = async (sessionId, location) => {
    try {
      // Mark attendance
      await attendanceService.markAttendance({
        sessionId,
        verificationMethod: "geolocation",
        location,
      })

      // Close geolocation and refresh data
      setShowGeolocation(false)
      setSelectedSession(null)
      fetchDashboardData()
    } catch (err) {
      console.error("Error marking attendance:", err)
      setError("Failed to mark attendance: " + (err.message || "Please try again."))
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "present":
        return (
          <Badge className="bg-green-500 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Present
          </Badge>
        )
      case "late":
        return (
          <Badge className="bg-yellow-500 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Late
          </Badge>
        )
      case "absent":
        return (
          <Badge className="bg-red-500 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Absent
          </Badge>
        )
      case "excused":
        return (
          <Badge className="bg-blue-500 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Excused
          </Badge>
        )
      default:
        return <Badge>Unknown</Badge>
    }
  }

  if (loading && !refreshing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Loading dashboard...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <StudentDashboardHeader user={currentUser} />

      <main className="container mx-auto px-4 py-6">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Student Dashboard</h1>
            <p className="text-muted-foreground">Track your attendance and upcoming sessions</p>
          </div>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Current Rotation Card */}
          <Card>
            <CardHeader>
              <CardTitle>Current Rotation</CardTitle>
              <CardDescription>Your active hospital assignment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-2">
                  <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{currentRotation?.hospital}</p>
                    <p className="text-sm text-muted-foreground">{currentRotation?.department} Department</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <CalendarIcon className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Rotation Period</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(currentRotation?.startDate).toLocaleDateString()} -{" "}
                      {new Date(currentRotation?.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <Clock className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Supervisor</p>
                    <p className="text-sm text-muted-foreground">{currentRotation?.supervisor}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance Overview</CardTitle>
              <CardDescription>Your current attendance statistics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {attendanceStats && (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Attendance Rate</span>
                      <span className="text-sm font-medium">
                        {attendanceStats.presentPercentage ? attendanceStats.presentPercentage.toFixed(1) : 0}%
                      </span>
                    </div>
                    <Progress value={attendanceStats.presentPercentage || 0} className="h-2" />
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-2">
                    <div className="flex flex-col items-center p-2 bg-muted rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mb-1" />
                      <span className="text-xl font-bold">{attendanceStats.present || 0}</span>
                      <span className="text-xs text-muted-foreground">Present</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-muted rounded-lg">
                      <Clock className="h-5 w-5 text-yellow-500 mb-1" />
                      <span className="text-xl font-bold">{attendanceStats.late || 0}</span>
                      <span className="text-xs text-muted-foreground">Late</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-muted rounded-lg">
                      <XCircle className="h-5 w-5 text-red-500 mb-1" />
                      <span className="text-xl font-bold">{attendanceStats.absent || 0}</span>
                      <span className="text-xs text-muted-foreground">Absent</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Mark attendance or view schedule</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full flex items-center justify-center gap-2" onClick={() => setShowScanner(true)}>
                <QrCode className="h-5 w-5" />
                Scan QR Code for Attendance
              </Button>

              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
                onClick={() => {
                  if (upcomingSessions.length > 0) {
                    setSelectedSession(upcomingSessions[0])
                    setShowGeolocation(true)
                  } else {
                    setError("No active sessions available for geolocation check-in")
                  }
                }}
              >
                <MapPin className="h-5 w-5" />
                Check-in with Geolocation
              </Button>

              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
                onClick={() => navigate("/student/reports")}
              >
                <BarChart3 className="h-5 w-5" />
                View Detailed Reports
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upcoming">Upcoming Sessions</TabsTrigger>
              <TabsTrigger value="recent">Recent Attendance</TabsTrigger>
              <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="mt-4">
              <div className="grid gap-4">
                {upcomingSessions.length > 0 ? (
                  upcomingSessions.map((session) => (
                    <Card key={session._id}>
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex items-start space-x-4">
                            <div className="bg-primary/10 p-2 rounded-lg">
                              <CalendarIcon className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{session.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(session.date).toLocaleDateString(undefined, {
                                  weekday: "long",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {session.startTime} - {session.endTime}
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">{session.location}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/student/sessions/${session._id}`)}
                            >
                              View Details
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedSession(session)
                                setShowGeolocation(true)
                              }}
                            >
                              Mark Attendance
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">No upcoming sessions found</div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="recent" className="mt-4">
              <div className="grid gap-4">
                {recentAttendance.length > 0 ? (
                  recentAttendance.map((record) => (
                    <Card key={record._id || record.id}>
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex items-start space-x-4">
                            <div
                              className={`p-2 rounded-lg ${
                                record.status === "present"
                                  ? "bg-green-100"
                                  : record.status === "late"
                                    ? "bg-yellow-100"
                                    : "bg-red-100"
                              }`}
                            >
                              {record.status === "present" ? (
                                <CheckCircle2 className="h-6 w-6 text-green-500" />
                              ) : record.status === "late" ? (
                                <Clock className="h-6 w-6 text-yellow-500" />
                              ) : (
                                <XCircle className="h-6 w-6 text-red-500" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{record.session.title}</p>
                                {getStatusBadge(record.status)}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {new Date(record.session.date).toLocaleDateString(undefined, {
                                  weekday: "long",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </p>
                              {record.checkInTime && (
                                <p className="text-sm text-muted-foreground">
                                  Check-in: {new Date(record.checkInTime).toLocaleTimeString()}
                                </p>
                              )}
                              {record.checkOutTime && (
                                <p className="text-sm text-muted-foreground">
                                  Check-out: {new Date(record.checkOutTime).toLocaleTimeString()}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/student/sessions/${record.session._id}`)}
                          >
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">No attendance records found</div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="calendar" className="mt-4">
              <Card>
                <CardContent className="p-4">
                  <Calendar mode="single" selected={date} onSelect={setDate} className="mx-auto" />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* QR Code Scanner Modal */}
        {showScanner && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Scan QR Code</CardTitle>
                <CardDescription>Scan the QR code displayed by your faculty to mark attendance</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <QRCodeScanner onScan={handleQRCodeScan} />
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowScanner(false)}>
                  Cancel
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {/* Geolocation Attendance Modal */}
        {showGeolocation && selectedSession && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Geolocation Attendance</CardTitle>
                <CardDescription>Mark attendance using your current location</CardDescription>
              </CardHeader>
              <CardContent>
                <GeolocationAttendance
                  session={selectedSession}
                  onSubmit={(location) => handleGeolocationAttendance(selectedSession._id, location)}
                />
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowGeolocation(false)
                    setSelectedSession(null)
                  }}
                >
                  Cancel
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}

export default StudentDashboard

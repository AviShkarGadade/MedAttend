"use client"

import { CardFooter } from "@/components/ui/card"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
import { StudentDashboardHeader } from "@/components/student-dashboard-header"
import { useAuth } from "@/components/auth-provider"
import ProtectedRoute from "@/components/protected-route"
import { sessionService } from "@/services/api"

export default function StudentDashboard() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([])
  const [recentAttendance, setRecentAttendance] = useState<any[]>([])
  const [attendanceStats, setAttendanceStats] = useState<any>(null)
  const [currentRotation, setCurrentRotation] = useState<any>(null)
  const [showScanner, setShowScanner] = useState(false)

  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)

        // Fetch upcoming sessions
        const sessionsResponse = await sessionService.getSessions({
          status: "upcoming",
          limit: 5,
        })
        setUpcomingSessions(sessionsResponse.data || [])

        // Fetch recent attendance
        // In a real app, we would have an API endpoint for this
        // For now, we'll use mock data
        const mockAttendance = [
          {
            id: "att001",
            date: "2025-04-01",
            status: "present",
            checkInTime: "07:55",
            checkOutTime: "16:05",
            session: {
              _id: "sess001",
              title: "Morning Rounds - Cardiology",
              date: "2025-04-01",
              startTime: "08:00",
              endTime: "16:00",
              location: "City General Hospital - Cardiology Wing",
            },
          },
          {
            id: "att002",
            date: "2025-03-31",
            status: "late",
            checkInTime: "08:20",
            checkOutTime: "16:10",
            session: {
              _id: "sess002",
              title: "Clinical Skills Workshop",
              date: "2025-03-31",
              startTime: "08:00",
              endTime: "16:00",
              location: "City General Hospital - Training Room B",
            },
          },
          {
            id: "att003",
            date: "2025-03-30",
            status: "absent",
            checkInTime: null,
            checkOutTime: null,
            session: {
              _id: "sess003",
              title: "Case Presentation Session",
              date: "2025-03-30",
              startTime: "14:00",
              endTime: "16:00",
              location: "City General Hospital - Conference Room A",
            },
          },
        ]
        setRecentAttendance(mockAttendance)

        // Fetch attendance stats
        // In a real app, we would have an API endpoint for this
        // For now, we'll use mock data
        const mockStats = {
          present: 18,
          absent: 2,
          late: 3,
          total: 23,
          presentPercentage: 78,
          absentPercentage: 9,
          latePercentage: 13,
        }
        setAttendanceStats(mockStats)

        // Fetch current rotation
        // In a real app, we would have an API endpoint for this
        // For now, we'll use mock data
        const mockRotation = {
          hospital: "City General Hospital",
          department: "Cardiology",
          supervisor: "Dr. Sarah Williams",
          startDate: "2025-03-15",
          endDate: "2025-04-15",
        }
        setCurrentRotation(mockRotation)
      } catch (err: any) {
        console.error("Error fetching dashboard data:", err)
        setError(err.message || "Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <Badge className="bg-green-500">Present</Badge>
      case "late":
        return <Badge className="bg-yellow-500">Late</Badge>
      case "absent":
        return <Badge className="bg-red-500">Absent</Badge>
      default:
        return <Badge>Unknown</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Loading...
      </div>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <div className="min-h-screen bg-background">
        <StudentDashboardHeader user={user} />

        <main className="container mx-auto px-4 py-6">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Current Rotation Card */}
            <Card>
              <CardHeader>
                <CardTitle>Current Session</CardTitle>
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
                        <span className="text-sm font-medium">{attendanceStats.presentPercentage}%</span>
                      </div>
                      <Progress value={attendanceStats.presentPercentage} className="h-2" />
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-2">
                      <div className="flex flex-col items-center p-2 bg-muted rounded-lg">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mb-1" />
                        <span className="text-xl font-bold">{attendanceStats.present}</span>
                        <span className="text-xs text-muted-foreground">Present</span>
                      </div>
                      <div className="flex flex-col items-center p-2 bg-muted rounded-lg">
                        <Clock className="h-5 w-5 text-yellow-500 mb-1" />
                        <span className="text-xl font-bold">{attendanceStats.late}</span>
                        <span className="text-xs text-muted-foreground">Late</span>
                      </div>
                      <div className="flex flex-col items-center p-2 bg-muted rounded-lg">
                        <XCircle className="h-5 w-5 text-red-500 mb-1" />
                        <span className="text-xl font-bold">{attendanceStats.absent}</span>
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
                      router.push(`/student/sessions/${upcomingSessions[0]._id}`)
                    } else {
                      setError("No upcoming sessions available")
                    }
                  }}
                >
                  <MapPin className="h-5 w-5" />
                  Check-in with Geolocation
                </Button>

                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => router.push("/student/reports")}
                >
                  <BarChart3 className="h-5 w-5" />
                  View Detailed Reports
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6">
            <Tabs defaultValue="upcoming">
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
                                onClick={() => router.push(`/student/sessions/${session._id}`)}
                              >
                                View Details
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => router.push(`/student/sessions/${session._id}/check-in`)}
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
                      <Card key={record.id}>
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
                                  <p className="text-sm text-muted-foreground">Check-in: {record.checkInTime}</p>
                                )}
                                {record.checkOutTime && (
                                  <p className="text-sm text-muted-foreground">Check-out: {record.checkOutTime}</p>
                                )}
                                <p className="text-sm text-muted-foreground mt-1">{record.session.location}</p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/student/sessions/${record.session._id}`)}
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
                  <div className="bg-muted w-full aspect-square rounded-lg flex items-center justify-center mb-4">
                    <QrCode className="h-16 w-16 text-muted-foreground" />
                    <p className="sr-only">QR Code Scanner</p>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">Position the QR code within the frame to scan</p>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowScanner(false)}>
                    Cancel
                  </Button>
                  <Button>Manual Entry</Button>
                </CardFooter>
              </Card>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}


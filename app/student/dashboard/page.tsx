"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Clock, MapPin, CheckCircle2, XCircle, BarChart3, QrCode, Camera } from "lucide-react"
import { StudentDashboardHeader } from "@/components/student-dashboard-header"
import { getAuth, onAuthStateChanged } from "firebase/auth"

export default function StudentDashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [attendanceData, setAttendanceData] = useState<any>(null)
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [showScanner, setShowScanner] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const auth = getAuth()

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user)
        // Fetch student profile and attendance data
        try {
          const idToken = await user.getIdToken()
          const response = await fetch("/api/student/dashboard", {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          })

          if (response.ok) {
            const data = await response.json()
            setAttendanceData(data.data)
          } else {
            console.error(`API error: ${response.status}`)
            // Use mock data instead of redirecting to login
            // This prevents the infinite redirect loop
          }
        } catch (error) {
          console.error("Error fetching student data:", error)
          // Don't redirect on network errors
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

  // Mock data for demonstration
  const mockAttendanceData = {
    student: {
      name: "Alex Johnson",
      id: "MED2023045",
      department: "Internal Medicine",
      year: 3,
    },
    currentRotation: {
      hospital: "City General Hospital",
      department: "Cardiology",
      supervisor: "Dr. Sarah Williams",
      startDate: "2025-03-15",
      endDate: "2025-04-15",
    },
    attendanceStats: {
      present: 18,
      absent: 2,
      late: 3,
      total: 23,
      percentage: 78,
    },
    upcomingSessions: [
      {
        id: "sess001",
        date: "2025-04-02",
        startTime: "08:00",
        endTime: "16:00",
        location: "City General Hospital - Cardiology Wing",
        supervisor: "Dr. Sarah Williams",
      },
      {
        id: "sess002",
        date: "2025-04-03",
        startTime: "09:00",
        endTime: "17:00",
        location: "City General Hospital - Cardiology Wing",
        supervisor: "Dr. Michael Chen",
      },
    ],
    recentAttendance: [
      {
        id: "att001",
        date: "2025-04-01",
        status: "present",
        checkInTime: "07:55",
        checkOutTime: "16:05",
        location: "City General Hospital",
      },
      {
        id: "att002",
        date: "2025-03-31",
        status: "late",
        checkInTime: "08:20",
        checkOutTime: "16:10",
        location: "City General Hospital",
      },
      {
        id: "att003",
        date: "2025-03-30",
        status: "absent",
        checkInTime: null,
        checkOutTime: null,
        location: "City General Hospital",
      },
    ],
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  // Use mock data for demonstration
  const data = mockAttendanceData

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

  return (
    <div className="min-h-screen bg-background">
      <StudentDashboardHeader user={data.student} />

      <main className="container mx-auto px-4 py-6">
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
                    <p className="font-medium">{data.currentRotation.hospital}</p>
                    <p className="text-sm text-muted-foreground">{data.currentRotation.department} Department</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <CalendarIcon className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Rotation Period</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(data.currentRotation.startDate).toLocaleDateString()} -{" "}
                      {new Date(data.currentRotation.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <Clock className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Supervisor</p>
                    <p className="text-sm text-muted-foreground">{data.currentRotation.supervisor}</p>
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
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Attendance Rate</span>
                  <span className="text-sm font-medium">{data.attendanceStats.percentage}%</span>
                </div>
                <Progress value={data.attendanceStats.percentage} className="h-2" />
              </div>

              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="flex flex-col items-center p-2 bg-muted rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mb-1" />
                  <span className="text-xl font-bold">{data.attendanceStats.present}</span>
                  <span className="text-xs text-muted-foreground">Present</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-muted rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-500 mb-1" />
                  <span className="text-xl font-bold">{data.attendanceStats.late}</span>
                  <span className="text-xs text-muted-foreground">Late</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-muted rounded-lg">
                  <XCircle className="h-5 w-5 text-red-500 mb-1" />
                  <span className="text-xl font-bold">{data.attendanceStats.absent}</span>
                  <span className="text-xs text-muted-foreground">Absent</span>
                </div>
              </div>
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

              <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                <MapPin className="h-5 w-5" />
                Check-in with Geolocation
              </Button>

              <Button variant="outline" className="w-full flex items-center justify-center gap-2">
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
                {data.upcomingSessions.map((session: any) => (
                  <Card key={session.id}>
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-start space-x-4">
                          <div className="bg-primary/10 p-2 rounded-lg">
                            <CalendarIcon className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">
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
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                          <Button size="sm">Set Reminder</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="recent" className="mt-4">
              <div className="grid gap-4">
                {data.recentAttendance.map((record: any) => (
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
                              <p className="font-medium">
                                {new Date(record.date).toLocaleDateString(undefined, {
                                  weekday: "long",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </p>
                              {getStatusBadge(record.status)}
                            </div>
                            {record.checkInTime && (
                              <p className="text-sm text-muted-foreground">Check-in: {record.checkInTime}</p>
                            )}
                            {record.checkOutTime && (
                              <p className="text-sm text-muted-foreground">Check-out: {record.checkOutTime}</p>
                            )}
                            <p className="text-sm text-muted-foreground mt-1">{record.location}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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

        {showScanner && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Scan QR Code</CardTitle>
                <CardDescription>Scan the QR code displayed by your faculty to mark attendance</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="bg-muted w-full aspect-square rounded-lg flex items-center justify-center mb-4">
                  <Camera className="h-16 w-16 text-muted-foreground" />
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
  )
}


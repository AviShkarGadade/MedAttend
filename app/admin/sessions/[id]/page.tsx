"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  CalendarIcon,
  Clock,
  MapPin,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock3,
  AlertCircle,
  Download,
  RefreshCw,
} from "lucide-react"
import { AdminDashboardHeader } from "@/components/admin-dashboard-header"
import { useAuth } from "@/components/auth-provider"

export default function AdminSessionDetailPage() {
  const [session, setSession] = useState<any>(null)
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("attendance")
  const [attendanceTaken, setAttendanceTaken] = useState(false)

  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const sessionId = params?.id as string

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        setLoading(true)

        if (!sessionId) {
          throw new Error("Session ID is missing")
        }

        // Get token from localStorage
        const token = localStorage.getItem("authToken")
        if (!token) {
          throw new Error("No authentication token found")
        }

        console.log("Fetching session with ID:", sessionId)

        // Fetch session details
        const sessionResponse = await fetch(`/api/sessions/${sessionId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!sessionResponse.ok) {
          const errorText = await sessionResponse.text()
          throw new Error(`Failed to fetch session: ${sessionResponse.status} - ${errorText}`)
        }

        const sessionData = await sessionResponse.json()
        console.log("Session data:", sessionData)
        setSession(sessionData.data)

        // Fetch attendance records
        const attendanceResponse = await fetch(`/api/sessions/${sessionId}/attendance`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!attendanceResponse.ok) {
          const errorText = await attendanceResponse.text()
          console.error("Failed to fetch attendance records:", errorText)
          setAttendanceRecords([])
        } else {
          const attendanceData = await attendanceResponse.json()
          console.log("Attendance data:", attendanceData)
          setAttendanceRecords(attendanceData.data || [])

          // Check if attendance has been taken
          const hasAttendance = attendanceData.data.some(
            (record: any) => record._id !== null && (record.status === "present" || record.status === "late"),
          )
          setAttendanceTaken(hasAttendance)
        }
      } catch (error: any) {
        console.error("Error fetching session data:", error)
        setError(error.message || "Failed to load session data")
      } finally {
        setLoading(false)
      }
    }

    if (sessionId) {
      fetchSessionData()
    }
  }, [sessionId])

  const getStatusBadge = (status: string) => {
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
            <Clock3 className="h-3 w-3" />
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Loading...
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Session not found or error loading session data</AlertDescription>
        </Alert>
      </div>
    )
  }

  // Calculate attendance statistics
  const totalStudents = attendanceRecords.length
  const presentCount = attendanceRecords.filter((record) => record.status === "present").length
  const lateCount = attendanceRecords.filter((record) => record.status === "late").length
  const absentCount = attendanceRecords.filter((record) => record.status === "absent").length
  const excusedCount = attendanceRecords.filter((record) => record.status === "excused").length
  const attendanceRate = totalStudents > 0 ? Math.round(((presentCount + lateCount) / totalStudents) * 100) : 0

  return (
    <div className="min-h-screen bg-background">
      <AdminDashboardHeader user={user} />

      <main className="container mx-auto px-4 py-6">
        <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">{session.title}</h1>
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
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline">{session.department?.name}</Badge>
              <Badge variant="outline">{session.hospital?.name}</Badge>
              <Badge variant="outline">Year {session.year}</Badge>
              <Badge
                className={
                  session.status === "active"
                    ? "bg-green-500"
                    : session.status === "upcoming"
                      ? "bg-blue-500"
                      : "bg-gray-500"
                }
              >
                {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
              </Badge>
              {attendanceTaken && (
                <Badge className="bg-green-500">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Attendance Taken
                </Badge>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        <Tabs defaultValue="attendance" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="details">Session Details</TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Summary</CardTitle>
                <CardDescription>
                  {attendanceTaken
                    ? `${presentCount + lateCount} out of ${totalStudents} students present (${attendanceRate}%)`
                    : "Attendance has not been taken for this session yet"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {attendanceTaken ? (
                  <>
                    <div className="grid grid-cols-4 gap-4 mb-6">
                      <div className="bg-green-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-600">{presentCount}</div>
                        <div className="text-sm text-green-600">Present</div>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-yellow-600">{lateCount}</div>
                        <div className="text-sm text-yellow-600">Late</div>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-red-600">{absentCount}</div>
                        <div className="text-sm text-red-600">Absent</div>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-blue-600">{excusedCount}</div>
                        <div className="text-sm text-blue-600">Excused</div>
                      </div>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                      <div className="grid grid-cols-12 gap-4 p-4 bg-muted font-medium">
                        <div className="col-span-4">Student</div>
                        <div className="col-span-2">ID</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-2">Check-in Time</div>
                        <div className="col-span-2">Notes</div>
                      </div>

                      {attendanceRecords.map((record) => (
                        <div key={record.student._id} className="grid grid-cols-12 gap-4 p-4 border-t">
                          <div className="col-span-4">
                            <div className="font-medium">{record.student.name}</div>
                            <div className="text-sm text-muted-foreground">{record.student.email}</div>
                          </div>
                          <div className="col-span-2 flex items-center">{record.student.studentId}</div>
                          <div className="col-span-2 flex items-center">{getStatusBadge(record.status)}</div>
                          <div className="col-span-2 flex items-center">
                            {record.checkInTime
                              ? new Date(record.checkInTime).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "-"}
                          </div>
                          <div className="col-span-2 flex items-center">{record.notes ? record.notes : "-"}</div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium">No Attendance Records</p>
                    <p>The faculty has not taken attendance for this session yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Session Details</CardTitle>
                <CardDescription>Detailed information about this session</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Description</h3>
                    <p className="text-muted-foreground mt-1">{session.description || "No description provided"}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-lg font-medium">Session Information</h3>
                      <ul className="mt-2 space-y-2">
                        <li className="flex items-start">
                          <CalendarIcon className="h-5 w-5 text-muted-foreground mr-2 mt-0.5" />
                          <div>
                            <span className="font-medium">Date:</span> {new Date(session.date).toLocaleDateString()}
                          </div>
                        </li>
                        <li className="flex items-start">
                          <Clock className="h-5 w-5 text-muted-foreground mr-2 mt-0.5" />
                          <div>
                            <span className="font-medium">Time:</span> {session.startTime} - {session.endTime}
                          </div>
                        </li>
                        <li className="flex items-start">
                          <MapPin className="h-5 w-5 text-muted-foreground mr-2 mt-0.5" />
                          <div>
                            <span className="font-medium">Location:</span> {session.location}
                          </div>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium">Additional Details</h3>
                      <ul className="mt-2 space-y-2">
                        <li>
                          <span className="font-medium">Faculty:</span> {session.faculty?.name || "Unknown"}
                        </li>
                        <li>
                          <span className="font-medium">Department:</span> {session.department?.name}
                        </li>
                        <li>
                          <span className="font-medium">Hospital:</span> {session.hospital?.name}
                        </li>
                        <li>
                          <span className="font-medium">Year:</span> {session.year}
                        </li>
                        <li>
                          <span className="font-medium">Status:</span>{" "}
                          {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                        </li>
                        <li>
                          <span className="font-medium">Created:</span> {new Date(session.createdAt).toLocaleString()}
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

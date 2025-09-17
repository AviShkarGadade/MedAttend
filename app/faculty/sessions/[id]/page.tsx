"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CalendarIcon,
  Clock,
  MapPin,
  Search,
  Download,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock3,
  AlertCircle,
  Save,
  RefreshCw,
} from "lucide-react"
import { FacultyDashboardHeader } from "@/components/faculty-dashboard-header"
import { useAuth } from "@/components/auth-provider"
import ProtectedRoute from "@/components/protected-route"

export default function SessionDetailPage() {
  const [session, setSession] = useState<any>(null)
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStudents, setSelectedStudents] = useState<Record<string, boolean>>({})
  const [attendanceStatus, setAttendanceStatus] = useState<Record<string, string>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
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

        const token = localStorage.getItem("authToken")
        if (!token) {
          throw new Error("No authentication token found")
        }

        console.log("Fetching session with ID:", sessionId)

        const sessionResponse = await fetch(`/api/sessions/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!sessionResponse.ok) {
          const errorText = await sessionResponse.text()
          throw new Error(`Failed to fetch session: ${sessionResponse.status} - ${errorText}`)
        }

        const sessionData = await sessionResponse.json()
        console.log("Session data:", sessionData)
        setSession(sessionData.data)

        const attendanceResponse = await fetch(`/api/sessions/${sessionId}/attendance`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!attendanceResponse.ok) {
          const errorText = await attendanceResponse.text()
          console.error("Failed to fetch attendance records:", errorText)
          setAttendanceRecords([])
        } else {
          const attendanceData = await attendanceResponse.json()
          console.log("Attendance data:", attendanceData)
          setAttendanceRecords(attendanceData.data || [])

          const hasAttendance = attendanceData.data.some(
            (record: any) => record._id !== null && (record.status === "present" || record.status === "late"),
          )
          setAttendanceTaken(hasAttendance)

          const initialSelected: Record<string, boolean> = {}
          const initialStatus: Record<string, string> = {}
          const initialNotes: Record<string, string> = {}

          attendanceData.data.forEach((record: any) => {
            initialSelected[record.student._id] = false
            initialStatus[record.student._id] = record.status || "absent"
            initialNotes[record.student._id] = record.notes || ""
          })

          setSelectedStudents(initialSelected)
          setAttendanceStatus(initialStatus)
          setNotes(initialNotes)
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

  const handleSelectAll = (checked: boolean) => {
    const newSelected = { ...selectedStudents }
    filteredAttendance.forEach((record) => {
      newSelected[record.student._id] = checked
    })
    setSelectedStudents(newSelected)
  }

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    setSelectedStudents({
      ...selectedStudents,
      [studentId]: checked,
    })
  }

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendanceStatus({
      ...attendanceStatus,
      [studentId]: status,
    })
  }

  const handleNotesChange = (studentId: string, note: string) => {
    setNotes({
      ...notes,
      [studentId]: note,
    })
  }

  const handleSaveAttendance = async () => {
    if (attendanceTaken) return // Prevent saving if attendance is already taken

    try {
      setSubmitting(true)
      setError(null)
      setSuccess(null)

      const selectedStudentIds = Object.keys(selectedStudents).filter((id) => selectedStudents[id])

      if (selectedStudentIds.length === 0) {
        setError("Please select at least one student")
        return
      }

      const token = localStorage.getItem("authToken")
      if (!token) {
        throw new Error("No authentication token found")
      }

      const attendanceRecords = selectedStudentIds.map((studentId) => ({
        studentId,
        status: attendanceStatus[studentId] || "absent",
        notes: notes[studentId] || "",
      }))

      console.log("Submitting attendance records:", attendanceRecords)

      const response = await fetch(`/api/attendance/${sessionId}/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ attendanceRecords }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to save attendance")
      }

      const responseData = await response.json()
      console.log("Attendance response:", responseData)

      const attendanceResponse = await fetch(`/api/sessions/${sessionId}/attendance`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (attendanceResponse.ok) {
        const attendanceResult = await attendanceResponse.json()
        setAttendanceRecords(attendanceResult.data || [])

        const hasAttendance = attendanceResult.data.some(
          (record: any) => record._id !== null && (record.status === "present" || record.status === "late"),
        )
        setAttendanceTaken(hasAttendance)
      }

      setSuccess("Attendance saved successfully")

      const resetSelected = { ...selectedStudents }
      Object.keys(resetSelected).forEach((id) => {
        resetSelected[id] = false
      })
      setSelectedStudents(resetSelected)
    } catch (error: any) {
      console.error("Error saving attendance:", error)
      setError(error.message || "Failed to save attendance")
    } finally {
      setSubmitting(false)
    }
  }

  const filteredAttendance = attendanceRecords.filter((record) => {
    return (
      record.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (record.student.studentId && record.student.studentId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (record.student.email && record.student.email.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  })

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

  return (
    <ProtectedRoute allowedRoles={["faculty"]}>
      <div className="min-h-screen bg-background">
        <FacultyDashboardHeader user={user} />

        <main className="container mx-auto px-4 py-6">
          <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sessions
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
              <Button variant="outline" onClick={() => router.push(`/faculty/sessions/${sessionId}/edit`)}>
                Edit Session
              </Button>
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
                  <CardTitle>Attendance Management</CardTitle>
                  <CardDescription>Mark and manage student attendance for this session</CardDescription>
                </CardHeader>
                <CardContent>
                  {attendanceTaken && (
                    <Alert className="mb-4 bg-green-50 border-green-200">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <AlertDescription className="text-green-700">
                        Attendance has already been recorded for this session and cannot be retaken.
                      </AlertDescription>
                    </Alert>
                  )}

                  {error && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {success && (
                    <Alert className="mb-4 bg-green-50 border-green-200">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <AlertDescription className="text-green-700">{success}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search students..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        disabled={attendanceTaken}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="select-all"
                        onCheckedChange={(checked) => handleSelectAll(checked === true)}
                        disabled={attendanceTaken}
                      />
                      <label
                        htmlFor="select-all"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Select All
                      </label>
                    </div>

                    <Button onClick={handleSaveAttendance} disabled={submitting || attendanceTaken} className="whitespace-nowrap">
                      {submitting ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Attendance
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <div className="grid grid-cols-12 gap-4 p-4 bg-muted font-medium">
                      <div className="col-span-1"></div>
                      <div className="col-span-3">Student</div>
                      <div className="col-span-2">ID</div>
                      <div className="col-span-3">Status</div>
                      <div className="col-span-3">Notes</div>
                    </div>

                    {filteredAttendance.length > 0 ? (
                      filteredAttendance.map((record) => (
                        <div key={record.student._id} className="grid grid-cols-12 gap-4 p-4 border-t">
                          <div className="col-span-1">
                            <Checkbox
                              checked={selectedStudents[record.student._id]}
                              onCheckedChange={(checked) => handleSelectStudent(record.student._id, checked === true)}
                              disabled={attendanceTaken}
                            />
                          </div>
                          <div className="col-span-3">
                            <div className="font-medium">{record.student.name}</div>
                            <div className="text-sm text-muted-foreground">{record.student.email}</div>
                          </div>
                          <div className="col-span-2 flex items-center">{record.student.studentId}</div>
                          <div className="col-span-3">
                            <Select
                              value={attendanceStatus[record.student._id] || record.status}
                              onValueChange={(value) => handleStatusChange(record.student._id, value)}
                              disabled={attendanceTaken}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="present">
                                  <div className="flex items-center">
                                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                                    Present
                                  </div>
                                </SelectItem>
                                <SelectItem value="late">
                                  <div className="flex items-center">
                                    <Clock3 className="h-4 w-4 text-yellow-500 mr-2" />
                                    Late
                                  </div>
                                </SelectItem>
                                <SelectItem value="absent">
                                  <div className="flex items-center">
                                    <XCircle className="h-4 w-4 text-red-500 mr-2" />
                                    Absent
                                  </div>
                                </SelectItem>
                                <SelectItem value="excused">
                                  <div className="flex items-center">
                                    <AlertCircle className="h-4 w-4 text-blue-500 mr-2" />
                                    Excused
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-3">
                            <Input
                              placeholder="Add notes (optional)"
                              value={notes[record.student._id] || record.notes || ""}
                              onChange={(e) => handleNotesChange(record.student._id, e.target.value)}
                              disabled={attendanceTaken}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-muted-foreground">
                        No students found matching your search
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Session Details</CardTitle>
                  <CardDescription>Additional information about the session</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>{session.description}</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </ProtectedRoute>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import { sessionService, attendanceService } from "../../services/api"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
  Alert,
  AlertDescription,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Badge,
} from "../../components/ui"
import { FacultyDashboardHeader } from "../../components/faculty/FacultyDashboardHeader"
import { QRCodeDisplay } from "../../components/faculty/QRCodeDisplay"
import {
  CalendarIcon,
  Clock,
  MapPin,
  Search,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock3,
  AlertCircle,
  Save,
  RefreshCw,
  QrCode,
} from "lucide-react"

const SessionDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentUser } = useAuth()

  const [session, setSession] = useState(null)
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStudents, setSelectedStudents] = useState({})
  const [attendanceStatus, setAttendanceStatus] = useState({})
  const [notes, setNotes] = useState({})
  const [activeTab, setActiveTab] = useState("attendance")
  const [showQRCode, setShowQRCode] = useState(false)
  const [attendanceTaken, setAttendanceTaken] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Fetch session and attendance data
  const fetchSessionData = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("Fetching session data for ID:", id)

      // Fetch session details
      const sessionResponse = await sessionService.getSessionById(id)
      setSession(sessionResponse.data)

      // Fetch attendance records
      const attendanceResponse = await sessionService.getSessionAttendance(id)
      setAttendanceRecords(attendanceResponse.data || [])

      // Check if attendance has been taken
      const hasAttendance = attendanceResponse.data.some(
        (record) => record._id !== null && (record.status === "present" || record.status === "late"),
      )
      setAttendanceTaken(hasAttendance)

      // Initialize selected state and status for all students
      const initialSelected = {}
      const initialStatus = {}
      const initialNotes = {}

      attendanceResponse.data.forEach((record) => {
        initialSelected[record.student._id] = false
        initialStatus[record.student._id] = record.status || "absent"
        initialNotes[record.student._id] = record.notes || ""
      })

      setSelectedStudents(initialSelected)
      setAttendanceStatus(initialStatus)
      setNotes(initialNotes)

      console.log("Session data loaded successfully")
    } catch (err) {
      console.error("Error fetching session data:", err)
      setError("Failed to load session data: " + (err.message || "Please try again."))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    if (id) {
      fetchSessionData()
    }
  }, [id])

  // Handle manual refresh
  const handleRefresh = () => {
    setRefreshing(true)
    fetchSessionData()
  }

  // Handle QR code generation
  const handleGenerateQRCode = async () => {
    try {
      const response = await sessionService.generateQRCode(id)
      setSession({
        ...session,
        qrCode: response.data.qrCode,
        qrCodeExpiry: response.data.expiry,
      })
      setShowQRCode(true)
    } catch (err) {
      console.error("Error generating QR code:", err)
      setError("Failed to generate QR code: " + (err.message || "Please try again."))
    }
  }

  // Handle select all students
  const handleSelectAll = (checked) => {
    const newSelected = { ...selectedStudents }
    filteredAttendance.forEach((record) => {
      newSelected[record.student._id] = checked
    })
    setSelectedStudents(newSelected)
  }

  // Handle select individual student
  const handleSelectStudent = (studentId, checked) => {
    setSelectedStudents({
      ...selectedStudents,
      [studentId]: checked,
    })
  }

  // Handle status change
  const handleStatusChange = (studentId, status) => {
    setAttendanceStatus({
      ...attendanceStatus,
      [studentId]: status,
    })
  }

  // Handle notes change
  const handleNotesChange = (studentId, note) => {
    setNotes({
      ...notes,
      [studentId]: note,
    })
  }

  // Handle save attendance
  const handleSaveAttendance = async () => {
    try {
      setSubmitting(true)
      setError(null)
      setSuccess(null)

      // Get selected students
      const selectedStudentIds = Object.keys(selectedStudents).filter((id) => selectedStudents[id])

      if (selectedStudentIds.length === 0) {
        setError("Please select at least one student")
        setSubmitting(false)
        return
      }

      // Prepare attendance records
      const attendanceRecords = selectedStudentIds.map((studentId) => ({
        studentId,
        status: attendanceStatus[studentId],
        notes: notes[studentId],
      }))

      console.log("Submitting attendance records:", attendanceRecords)

      // Submit bulk attendance
      await attendanceService.markBulkAttendance(id, attendanceRecords)

      // Refresh attendance data
      const attendanceResponse = await sessionService.getSessionAttendance(id)
      setAttendanceRecords(attendanceResponse.data || [])

      // Check if attendance has been taken
      const hasAttendance = attendanceResponse.data.some(
        (record) => record._id !== null && (record.status === "present" || record.status === "late"),
      )
      setAttendanceTaken(hasAttendance)

      // Reset selected students
      const resetSelected = { ...selectedStudents }
      Object.keys(resetSelected).forEach((id) => {
        resetSelected[id] = false
      })
      setSelectedStudents(resetSelected)

      setSuccess("Attendance saved successfully")
    } catch (err) {
      console.error("Error saving attendance:", err)
      setError("Failed to save attendance: " + (err.message || "Please try again."))
    } finally {
      setSubmitting(false)
    }
  }

  // Filter attendance records based on search query
  const filteredAttendance = attendanceRecords.filter((record) => {
    return (
      record.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (record.student.studentId && record.student.studentId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (record.student.email && record.student.email.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  })

  // Get status badge component
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

  if (loading && !refreshing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Loading session data...</span>
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
      <FacultyDashboardHeader user={currentUser} />

      <main className="container mx-auto px-4 py-6">
        <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
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
            <Button variant="outline" onClick={handleGenerateQRCode}>
              <QrCode className="h-4 w-4 mr-2" />
              QR Code
            </Button>
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
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
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox id="select-all" onCheckedChange={(checked) => handleSelectAll(checked === true)} />
                    <label
                      htmlFor="select-all"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Select All
                    </label>
                  </div>

                  <Button onClick={handleSaveAttendance} disabled={submitting} className="whitespace-nowrap">
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
                          />
                        </div>
                        <div className="col-span-3">
                          <div className="font-medium">{record.student.name}</div>
                          <div className="text-sm text-muted-foreground">{record.student.email}</div>
                        </div>
                        <div className="col-span-2 flex items-center">{record.student.studentId}</div>
                        <div className="col-span-3">
                          <Select
                            value={attendanceStatus[record.student._id]}
                            onValueChange={(value) => handleStatusChange(record.student._id, value)}
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
                            value={notes[record.student._id] || ""}
                            onChange={(e) => handleNotesChange(record.student._id, e.target.value)}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">No students found matching your search</div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="text-sm text-muted-foreground">
                  {filteredAttendance.length} students in this session
                </div>
                <Button onClick={handleSaveAttendance} disabled={submitting}>
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
              </CardFooter>
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

      {/* QR Code Modal */}
      {showQRCode && (
        <QRCodeDisplay session={session} onClose={() => setShowQRCode(false)} onRefresh={handleGenerateQRCode} />
      )}
    </div>
  )
}

export default SessionDetail

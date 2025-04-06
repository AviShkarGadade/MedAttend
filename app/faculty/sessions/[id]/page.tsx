"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  QrCode,
  UserPlus,
  AlertCircle,
} from "lucide-react"
import { FacultyDashboardHeader } from "@/components/faculty-dashboard-header"
import { QRCodeDisplay } from "@/frontend/src/components/faculty/QRCodeDisplay"
import { ManualAttendance } from "@/frontend/src/components/faculty/ManualAttendance"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { sessionService, attendanceService } from "@/services/api"

export default function SessionDetailPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<any>(null)
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showQRCode, setShowQRCode] = useState(false)
  const [showManualAttendance, setShowManualAttendance] = useState(false)
  const router = useRouter()
  const params = useParams()
  const sessionId = params.id

  useEffect(() => {
    const auth = getAuth()

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user)
        // Fetch session and attendance data
        try {
          const idToken = await user.getIdToken()

          // Fetch session details
          const sessionResponse = await sessionService.getSessionById(sessionId as string)
          setSession(sessionResponse.data)

          // Fetch attendance records
          const attendanceResponse = await attendanceService.getSessionAttendance(sessionId as string, {})
          setAttendanceRecords(attendanceResponse.data)
        } catch (error) {
          console.error("Error fetching session data:", error)
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
  }, [router, sessionId])

  const handleGenerateQRCode = async () => {
    try {
      const response = await sessionService.generateQRCode(sessionId as string)
      setSession({
        ...session,
        qrCode: response.data.qrCode,
        qrCodeExpiry: response.data.expiry,
      })
      setShowQRCode(true)
    } catch (error) {
      console.error("Error generating QR code:", error)
    }
  }

  const handleStatusChange = async (attendanceId: string, newStatus: string) => {
    try {
      await attendanceService.updateAttendance(attendanceId, {
        status: newStatus,
      })

      // Refresh attendance records
      const attendanceResponse = await attendanceService.getSessionAttendance(sessionId as string, {})
      setAttendanceRecords(attendanceResponse.data)
    } catch (error) {
      console.error("Error updating attendance status:", error)
    }
  }

  const handleAttendanceSuccess = async () => {
    // Refresh attendance records
    try {
      const attendanceResponse = await attendanceService.getSessionAttendance(sessionId as string, {})
      setAttendanceRecords(attendanceResponse.data)
    } catch (error) {
      console.error("Error refreshing attendance records:", error)
    }
  }

  const filteredAttendance = attendanceRecords.filter((record) => {
    const matchesSearch =
      record.student?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.student?.studentId?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || record.status === statusFilter

    return matchesSearch && matchesStatus
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
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!session) {
    return <div className="flex items-center justify-center min-h-screen">Session not found</div>
  }

  return (
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
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleGenerateQRCode}>
              <QrCode className="h-4 w-4 mr-2" />
              QR Code
            </Button>
            <Button onClick={() => setShowManualAttendance(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Manual Attendance
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Attendance Record</CardTitle>
            <CardDescription>
              {attendanceRecords.filter((r) => r.status === "present" || r.status === "late").length} of{" "}
              {attendanceRecords.length} students present
            </CardDescription>
          </CardHeader>
          <CardContent>
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

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="excused">Excused</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-12 gap-4 p-4 bg-muted font-medium">
                <div className="col-span-3">Student</div>
                <div className="col-span-2">ID</div>
                <div className="col-span-2">Year</div>
                <div className="col-span-2">Check-in</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-2">Actions</div>
              </div>

              {filteredAttendance.length > 0 ? (
                filteredAttendance.map((record) => (
                  <div key={record._id} className="grid grid-cols-12 gap-4 p-4 border-t">
                    <div className="col-span-3 font-medium">{record.student?.name}</div>
                    <div className="col-span-2">{record.student?.studentId}</div>
                    <div className="col-span-2">Year {record.student?.year}</div>
                    <div className="col-span-2">
                      {record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : "-"}
                    </div>
                    <div className="col-span-1">{getStatusBadge(record.status)}</div>
                    <div className="col-span-2">
                      <Select
                        defaultValue={record.status}
                        onValueChange={(value) => handleStatusChange(record._id, value)}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Change status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="present">Mark Present</SelectItem>
                          <SelectItem value="late">Mark Late</SelectItem>
                          <SelectItem value="absent">Mark Absent</SelectItem>
                          <SelectItem value="excused">Mark Excused</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-muted-foreground">No students found matching your filters</div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* QR Code Modal */}
      {showQRCode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <QRCodeDisplay session={session} onClose={() => setShowQRCode(false)} onRefresh={handleGenerateQRCode} />
        </div>
      )}

      {/* Manual Attendance Modal */}
      {showManualAttendance && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <ManualAttendance
            session={session}
            onClose={() => setShowManualAttendance(false)}
            onSuccess={handleAttendanceSuccess}
          />
        </div>
      )}
    </div>
  )
}


"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import { sessionService, userService } from "../../services/api"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Alert,
  AlertDescription,
} from "../../components/ui"
import { FacultyDashboardHeader } from "../../components/faculty/FacultyDashboardHeader"
import { QRCodeDisplay } from "../../components/faculty/QRCodeDisplay"
import { CalendarIcon, Clock, MapPin, Users, QrCode, BarChart3, Plus, RefreshCw, AlertCircle } from "lucide-react"

const FacultyDashboard = () => {
  const { currentUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentSessions, setCurrentSessions] = useState([])
  const [upcomingSessions, setUpcomingSessions] = useState([])
  const [students, setStudents] = useState([])
  const [showQRCode, setShowQRCode] = useState(false)
  const [selectedSession, setSelectedSession] = useState(null)
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

      // Fetch students in faculty's department
      const studentsResponse = await userService.getUsers({
        role: "student",
        department: currentUser.department,
      })

      console.log("Active sessions:", activeSessions.data)
      console.log("Upcoming sessions:", upcomingSessions.data)

      setCurrentSessions(activeSessions.data || [])
      setUpcomingSessions(upcomingSessions.data || [])
      setStudents(studentsResponse.data || [])
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

  const handleGenerateQRCode = async (session) => {
    try {
      const response = await sessionService.generateQRCode(session._id)
      setSelectedSession({
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
      <FacultyDashboardHeader user={currentUser} />

      <main className="container mx-auto px-4 py-6">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

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
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
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
                  <div className="text-center py-6 text-muted-foreground">
                    No active sessions for today
                    <div className="mt-2">
                      <Button variant="outline" size="sm" onClick={() => navigate("/faculty/create-session")}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Session
                      </Button>
                    </div>
                  </div>
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
      </main>

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
    </div>
  )
}

export default FacultyDashboard

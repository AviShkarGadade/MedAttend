"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BarChart3, Plus, AlertCircle, CalendarIcon, Clock, MapPin, Users, QrCode, RefreshCw } from "lucide-react"
import { FacultyDashboardHeader } from "@/components/faculty-dashboard-header"
import { useAuth } from "@/components/auth-provider"
import { DashboardFallback } from "@/components/dashboard-fallback"

export default function FacultyDashboard() {
  const [currentSessions, setCurrentSessions] = useState<any[]>([])
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [apiRetries, setApiRetries] = useState(0)
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        // Get token from localStorage
        const token = localStorage.getItem("authToken")
        if (!token) {
          throw new Error("No authentication token found")
        }

        const todayIso = new Date().toISOString().split("T")[0]
        console.log("Today's date:", todayIso)

        const activeSessions = await fetch(`/api/sessions?status=active&date=${todayIso}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        // Fetch upcoming sessions
        const upcomingSessions = await fetch("/api/sessions?status=upcoming&limit=5", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        let activeSessionsData = []
        let upcomingSessionsData = []

        if (activeSessions.ok) {
          const activeData = await activeSessions.json()
          activeSessionsData = activeData.data || []
          console.log("Active sessions:", activeSessionsData)
        } else {
          console.error("Failed to fetch active sessions:", await activeSessions.text())
        }

        if (upcomingSessions.ok) {
          const upcomingData = await upcomingSessions.json()
          upcomingSessionsData = upcomingData.data || []
          console.log("Upcoming sessions:", upcomingSessionsData)
        } else {
          console.error("Failed to fetch upcoming sessions:", await upcomingSessions.text())
        }

        // Set session data
        setCurrentSessions(activeSessionsData)
        setUpcomingSessions(upcomingSessionsData)
        setError(null)
      } catch (error: any) {
        console.error("Error fetching faculty data:", error)
        setError(error.message || "Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }

    if (user && user.role === "faculty") {
      fetchDashboardData()

      const intervalId = setInterval(fetchDashboardData, 60 * 1000)

      return () => clearInterval(intervalId)
    }
  }, [user, apiRetries])

  const handleRetry = () => {
    setApiRetries((prev) => prev + 1)
  }

  const handleGenerateQRCode = async (sessionId: string) => {
    // Navigate to session detail page
    router.push(`/faculty/sessions/${sessionId}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Loading...
      </div>
    )
  }

  if (!user) {
    return <DashboardFallback role="faculty" error="User not authenticated" />
  }

  return (
    <div className="min-h-screen bg-background">
      <FacultyDashboardHeader user={user} />

      <main className="container mx-auto px-4 py-6">
        {error && (
          <div className="mb-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}{" "}
                <Button variant="link" onClick={handleRetry}>
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Faculty Dashboard</h1>
            <p className="text-muted-foreground">Manage attendance and monitor student progress</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => router.push("/faculty/create-session")}>
              <Plus className="h-4 w-4 mr-2" />
              Create Session
            </Button>
            <Button variant="outline" onClick={() => router.push("/faculty/reports")}>
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
              <Button variant="outline" size="sm" onClick={handleRetry}>
                <RefreshCw className="h-4 w-4" />
              </Button>
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
                          <Button variant="outline" size="sm" onClick={() => handleGenerateQRCode(session._id)}>
                            <QrCode className="h-4 w-4 mr-2" />
                            QR Code
                          </Button>
                          <Button size="sm" onClick={() => router.push(`/faculty/sessions/${session._id}`)}>
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
              <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={() => router.push("/faculty/sessions")}>
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
                              {new Date(session.date).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })}
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
                            onClick={() => router.push(`/faculty/sessions/${session._id}/edit`)}
                          >
                            Edit
                          </Button>
                          <Button size="sm" onClick={() => router.push(`/faculty/sessions/${session._id}`)}>
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
    </div>
  )
}

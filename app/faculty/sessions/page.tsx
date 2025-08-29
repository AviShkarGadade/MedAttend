"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CalendarIcon, Clock, MapPin, Users, QrCode, Plus, Search, Filter, AlertCircle, RefreshCw } from "lucide-react"
import { FacultyDashboardHeader } from "@/components/faculty-dashboard-header"
import { useAuth } from "@/components/auth-provider" // Use same auth as dashboard
import { DashboardFallback } from "@/components/dashboard-fallback"
import ProtectedRoute from "@/components/protected-route"

export default function FacultySessions() {
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("active")
  const [searchQuery, setSearchQuery] = useState("")
  const [dateFilter, setDateFilter] = useState("all")
  const [showQRCode, setShowQRCode] = useState(false)
  const [selectedSession, setSelectedSession] = useState<any>(null)
  const [apiRetries, setApiRetries] = useState(0)
  
  const router = useRouter()
  const { user } = useAuth() // Use consistent auth system

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const token = localStorage.getItem("authToken")
        if (!token) {
          throw new Error("No authentication token found")
        }

        // Fetch all sessions (not just today's)
        const response = await fetch("/api/sessions", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error("API Error:", response.status, errorText)
          throw new Error(`Failed to fetch sessions: ${response.status}`)
        }

        const data = await response.json()
        const sessionsData = data.data || []
        
        console.log("Fetched sessions:", sessionsData)
        setSessions(sessionsData)
        
      } catch (error: any) {
        console.error("Error fetching sessions:", error)
        setError(error.message || "Failed to load sessions")
      } finally {
        setLoading(false)
      }
    }

    if (user && user.role === "faculty") {
      fetchSessions()
    }
  }, [user, apiRetries])

  const handleRetry = () => {
    setApiRetries(prev => prev + 1)
  }

  // Helper function to categorize sessions
  const categorizeSessions = (sessions: any[]) => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const currentTime = now.toTimeString().split(' ')[0].slice(0, 5) // HH:MM format
    
    return sessions.reduce((acc, session) => {
      const sessionDate = session.date
      const sessionEndTime = session.endTime
      
      // Determine session status
      if (sessionDate < today || (sessionDate === today && currentTime > sessionEndTime)) {
        acc.completed.push({ ...session, status: 'completed' })
      } else if (sessionDate === today && currentTime >= session.startTime && currentTime <= sessionEndTime) {
        acc.active.push({ ...session, status: 'active' })
      } else {
        acc.upcoming.push({ ...session, status: 'upcoming' })
      }
      
      return acc
    }, { active: [], upcoming: [], completed: [] })
  }

  const categorizedSessions = categorizeSessions(sessions)

  const filteredSessions = (() => {
    let sessionList = []
    
    switch(activeTab) {
      case "active":
        sessionList = categorizedSessions.active
        break
      case "upcoming":
        sessionList = categorizedSessions.upcoming
        break
      case "completed":
        sessionList = categorizedSessions.completed
        break
      default:
        sessionList = []
    }

    return sessionList.filter((session: any) => {
      const matchesSearch =
        session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.location.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesDate = dateFilter === "all" || session.date === dateFilter

      return matchesSearch && matchesDate
    })
  })()

  const handleGenerateQRCode = (session: any) => {
    setSelectedSession(session)
    setShowQRCode(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Loading sessions...
      </div>
    )
  }

  if (!user) {
    return <DashboardFallback role="faculty" error="User not authenticated" />
  }

  return (
    <ProtectedRoute allowedRoles={["faculty"]}>
      <div className="min-h-screen bg-background">
        <FacultyDashboardHeader user={user} />

        <main className="container mx-auto px-4 py-6">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}{" "}
                <Button variant="link" onClick={handleRetry} className="h-auto p-0">
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold">Attendance Sessions</h1>
              <p className="text-muted-foreground">
                Manage and track attendance sessions 
                ({categorizedSessions.active.length} active, {categorizedSessions.upcoming.length} upcoming)
              </p>
            </div>
            <Button onClick={() => router.push("/faculty/create-session")}>
              <Plus className="h-4 w-4 mr-2" />
              Create Session
            </Button>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="active">
                    Active ({categorizedSessions.active.length})
                  </TabsTrigger>
                  <TabsTrigger value="upcoming">
                    Upcoming ({categorizedSessions.upcoming.length})
                  </TabsTrigger>
                  <TabsTrigger value="completed">
                    Completed ({categorizedSessions.completed.length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search sessions..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Dates</SelectItem>
                      {/* Generate date options from available sessions */}
                      {Array.from(new Set(sessions.map(s => s.date)))
                        .sort()
                        .map(date => (
                          <SelectItem key={date} value={date}>
                            {new Date(date).toLocaleDateString()}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={handleRetry}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {filteredSessions.length > 0 ? (
                  filteredSessions.map((session: any) => (
                    <Card key={session._id} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="p-4 border-l-4 border-primary">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                              <h3 className="font-medium text-lg">{session.title}</h3>
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

                              <div className="flex items-center mt-3 gap-4">
                                <Badge
                                  className={
                                    session.status === "active"
                                      ? "bg-green-500"
                                      : session.status === "upcoming"
                                        ? "bg-blue-500"
                                        : "bg-gray-500"
                                  }
                                >
                                  {session.status === "active"
                                    ? "Active"
                                    : session.status === "upcoming"
                                      ? "Upcoming"
                                      : "Completed"}
                                </Badge>
                                <div className="flex items-center text-sm">
                                  <Users className="h-4 w-4 mr-1" />
                                  <span>
                                    {session.attendanceCount || 0} / {session.totalStudents || 0} students
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              {session.status === "active" && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleGenerateQRCode(session)}
                                  >
                                    <QrCode className="h-4 w-4 mr-2" />
                                    QR Code
                                  </Button>
                                  <Button size="sm" onClick={() => router.push(`/faculty/sessions/${session._id}`)}>
                                    Take Attendance
                                  </Button>
                                </>
                              )}

                              {session.status === "upcoming" && (
                                <>
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
                                </>
                              )}

                              {session.status === "completed" && (
                                <Button size="sm" onClick={() => router.push(`/faculty/sessions/${session._id}`)}>
                                  View Report
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No {activeTab} sessions found
                    {searchQuery || dateFilter !== "all" ? " matching your filters" : ""}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </main>

        {/* QR Code Dialog */}
        {showQRCode && selectedSession && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Attendance QR Code</CardTitle>
                <CardDescription>Students can scan this QR code to mark their attendance</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="bg-white p-4 rounded-lg mb-4">
                  <div className="w-64 h-64 bg-gray-200 flex items-center justify-center rounded">
                    <p className="text-sm text-gray-500">QR Code for {selectedSession._id}</p>
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <p className="font-medium">{selectedSession.title}</p>
                  <p className="text-sm text-muted-foreground">Valid for the next 10 minutes</p>
                  <p className="text-sm text-muted-foreground">
                    Session ID: {selectedSession._id?.slice(-6).toUpperCase()}
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setShowQRCode(false)}>
                  Close
                </Button>
                <Button onClick={() => setShowQRCode(false)}>Refresh Code</Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
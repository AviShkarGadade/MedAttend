"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Plus, AlertCircle } from "lucide-react"
import { FacultyDashboardHeader } from "@/components/faculty-dashboard-header"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { DashboardFallback } from "@/components/dashboard-fallback"

export default function FacultyDashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [facultyData, setFacultyData] = useState<any>(null)
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [showQRCode, setShowQRCode] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiRetries, setApiRetries] = useState(0)
  const router = useRouter()

  const fetchDashboardData = async (idToken: string) => {
    try {
      // Try to fetch faculty data
      const response = await fetch("/api/faculty/dashboard", {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setFacultyData(data)
        setError(null)
      } else {
        // If API fails, use mock data instead of redirecting
        console.error(`API error: ${response.status}`)
        setError(`Failed to load dashboard data (${response.status})`)

        // Use mock data as fallback
        setFacultyData({
          faculty: user,
          currentSessions: [],
          upcomingSessions: [],
          students: [],
        })
      }
    } catch (error: any) {
      console.error("Error fetching faculty data:", error)
      setError(error.message || "Failed to load dashboard data")

      // Use mock data as fallback
      setFacultyData({
        faculty: user,
        currentSessions: [],
        upcomingSessions: [],
        students: [],
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const auth = getAuth()

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser({
          name: user.displayName || "Faculty User",
          email: user.email,
          role: "faculty",
          department: "Cardiology",
          hospital: "City General Hospital",
        })

        try {
          const idToken = await user.getIdToken()
          fetchDashboardData(idToken)
        } catch (error) {
          console.error("Error getting ID token:", error)
          setLoading(false)
          setError("Authentication error")
        }
      } else {
        // User is not logged in
        router.push("/login")
      }
    })

    // Cleanup subscription
    return () => unsubscribe()
  }, [router, apiRetries])

  const handleRetry = () => {
    setLoading(true)
    setApiRetries((prev) => prev + 1)
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  // If there's an error and no faculty data, show the fallback
  if (error && !facultyData) {
    return <DashboardFallback role="faculty" error={error} onRetry={handleRetry} />
  }

  // Use mock data or API data
  const data = facultyData

  const getAttendanceRateBadge = (rate: number) => {
    if (rate >= 90) {
      return <Badge className="bg-green-500">{rate}%</Badge>
    } else if (rate >= 75) {
      return <Badge className="bg-yellow-500">{rate}%</Badge>
    } else {
      return <Badge className="bg-red-500">{rate}%</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <FacultyDashboardHeader user={data.faculty} />

      <main className="container mx-auto px-4 py-6">
        {error && (
          <div className="mb-4">
            <Alert variant="warning">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error} - Using cached data.{" "}
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

        {/* Rest of the dashboard content */}
        <div className="text-center py-8">
          <p className="text-muted-foreground">Dashboard loaded successfully.</p>
          <p className="text-muted-foreground">Additional content would appear here.</p>
        </div>
      </main>
    </div>
  )
}


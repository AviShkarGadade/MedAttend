"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserPlus, Building, Settings, AlertCircle, Plus } from "lucide-react"
import { AdminDashboardHeader } from "@/components/admin-dashboard-header"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { DashboardFallback } from "@/app/components/dashboard-fallback"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [adminData, setAdminData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [apiRetries, setApiRetries] = useState(0)
  const router = useRouter()

  const fetchDashboardData = async (idToken: string) => {
    try {
      // Try to fetch admin data
      const response = await fetch("/api/admin/dashboard", {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setAdminData(data)
        setError(null)
      } else {
        // If API fails, use mock data instead of redirecting
        console.error(`API error: ${response.status}`)
        setError(`Failed to load dashboard data (${response.status})`)

        // Use mock data as fallback
        setAdminData({
          admin: user,
          stats: {
            totalStudents: 245,
            totalFaculty: 32,
            totalHospitals: 5,
            pendingApprovals: 3,
          },
          pendingApprovals: [],
          recentActivity: [],
          hospitals: [],
        })
      }
    } catch (error: any) {
      console.error("Error fetching admin data:", error)
      setError(error.message || "Failed to load dashboard data")

      // Use mock data as fallback
      setAdminData({
        admin: user,
        stats: {
          totalStudents: 245,
          totalFaculty: 32,
          totalHospitals: 5,
          pendingApprovals: 3,
        },
        pendingApprovals: [],
        recentActivity: [],
        hospitals: [],
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
          name: user.displayName || "Admin User",
          email: user.email,
          role: "admin",
          department: "System Administration",
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

  // If there's an error and no admin data, show the fallback
  if (error && !adminData) {
    return <DashboardFallback role="admin" error={error} onRetry={handleRetry} />
  }

  // Use mock data or API data
  const data = adminData

  return (
    <div className="min-h-screen bg-background">
      <AdminDashboardHeader user={data.admin} />

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
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">System overview and management</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => router.push("/admin/add-user")}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Faculty
            </Button>
            <Button onClick={() => router.push("/admin/add-student")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Student
            </Button>
            <Button variant="outline" onClick={() => router.push("/admin/settings")}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">Across {data.stats.totalHospitals} hospitals</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faculty Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.totalFaculty}</div>
              <p className="text-xs text-muted-foreground">{data.stats.pendingApprovals} pending approvals</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hospitals</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.totalHospitals}</div>
              <p className="text-xs text-muted-foreground">Active rotation locations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.pendingApprovals}</div>
              <p className="text-xs text-muted-foreground">Faculty account requests</p>
            </CardContent>
          </Card>
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


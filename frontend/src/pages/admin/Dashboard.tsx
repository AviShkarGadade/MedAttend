"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import { userService, hospitalService } from "../../services/api"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Input,
} from "../../components/ui"
import { AdminDashboardHeader } from "../../components/admin/AdminDashboardHeader"
import { Users, UserPlus, Building, Settings, Search, Download, CheckCircle, XCircle, AlertCircle } from "lucide-react"

const AdminDashboard: React.FC = () => {
  const { currentUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<any>({
    totalStudents: 0,
    totalFaculty: 0,
    totalHospitals: 0,
    pendingApprovals: 0,
  })
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [hospitals, setHospitals] = useState<any[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)

        // Fetch user stats
        const studentsResponse = await userService.getUsers({ role: "student" })
        const facultyResponse = await userService.getUsers({ role: "faculty" })
        const pendingFacultyResponse = await userService.getUsers({
          role: "faculty",
          isApproved: false,
        })

        // Fetch hospitals
        const hospitalsResponse = await hospitalService.getHospitals()

        // Set stats
        setStats({
          totalStudents: studentsResponse.total,
          totalFaculty: facultyResponse.total,
          totalHospitals: hospitalsResponse.data.length,
          pendingApprovals: pendingFacultyResponse.total,
        })

        // Set pending approvals
        setPendingApprovals(pendingFacultyResponse.data)

        // Set hospitals
        setHospitals(hospitalsResponse.data)

        // Mock recent activity for now
        // In a real app, this would come from an API
        setRecentActivity([
          {
            id: "act001",
            type: "user_added",
            description: "Added new student: Maria Garcia",
            timestamp: "2025-04-01T14:30:00Z",
            performedBy: currentUser.name,
          },
          {
            id: "act002",
            type: "user_approved",
            description: "Approved faculty account: Dr. Lisa Wong",
            timestamp: "2025-04-01T11:15:00Z",
            performedBy: currentUser.name,
          },
          {
            id: "act003",
            type: "hospital_added",
            description: "Added new hospital: Riverside Medical Center",
            timestamp: "2025-03-31T09:45:00Z",
            performedBy: currentUser.name,
          },
        ])
      } catch (err: any) {
        console.error("Error fetching dashboard data:", err)
        setError("Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [currentUser])

  const handleApproveFaculty = async (id: string) => {
    try {
      await userService.approveFaculty(id)

      // Update pending approvals list
      setPendingApprovals(pendingApprovals.filter((faculty) => faculty._id !== id))

      // Update stats
      setStats({
        ...stats,
        pendingApprovals: stats.pendingApprovals - 1,
      })
    } catch (err: any) {
      console.error("Error approving faculty:", err)
      setError("Failed to approve faculty")
    }
  }

  const handleRejectFaculty = async (id: string) => {
    try {
      await userService.rejectFaculty(id, "Rejected by admin")

      // Update pending approvals list
      setPendingApprovals(pendingApprovals.filter((faculty) => faculty._id !== id))

      // Update stats
      setStats({
        ...stats,
        pendingApprovals: stats.pendingApprovals - 1,
      })
    } catch (err: any) {
      console.error("Error rejecting faculty:", err)
      setError("Failed to reject faculty")
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminDashboardHeader user={currentUser} />

      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">System overview and management</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/admin/add-user")}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
            <Button variant="outline" onClick={() => navigate("/admin/settings")}>
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
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">Across {stats.totalHospitals} hospitals</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faculty Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalFaculty}</div>
              <p className="text-xs text-muted-foreground">{stats.pendingApprovals} pending approvals</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hospitals</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalHospitals}</div>
              <p className="text-xs text-muted-foreground">Active rotation locations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingApprovals}</div>
              <p className="text-xs text-muted-foreground">Faculty account requests</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>Faculty accounts awaiting approval</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingApprovals.length > 0 ? (
                  pendingApprovals.map((faculty) => (
                    <div key={faculty._id} className="border rounded-lg p-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <h3 className="font-medium">{faculty.name}</h3>
                          <p className="text-sm text-muted-foreground">{faculty.email}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant="outline">{faculty.department.name}</Badge>
                            <Badge variant="outline">{faculty.hospital.name}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Requested on {new Date(faculty.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => handleRejectFaculty(faculty._id)}
                          >
                            <XCircle className="h-4 w-4" />
                            Reject
                          </Button>
                          <Button size="sm" className="gap-1" onClick={() => handleApproveFaculty(faculty._id)}>
                            <CheckCircle className="h-4 w-4" />
                            Approve
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground">No pending approval requests</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest system activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex items-start gap-2">
                      {activity.type === "user_added" && <UserPlus className="h-5 w-5 text-blue-500 mt-0.5" />}
                      {activity.type === "user_approved" && <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />}
                      {activity.type === "hospital_added" && <Building className="h-5 w-5 text-purple-500 mt-0.5" />}
                      <div>
                        <p>{activity.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">by {activity.performedBy}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="w-full">
                View All Activity
              </Button>
            </CardFooter>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Hospital Management</CardTitle>
            <CardDescription>View and manage hospital locations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search hospitals..." className="pl-10" />
              </div>
              <Button variant="outline" className="flex gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button className="flex gap-2" onClick={() => navigate("/admin/hospitals/add")}>
                <Building className="h-4 w-4" />
                Add Hospital
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-12 gap-4 p-4 bg-muted font-medium">
                <div className="col-span-4">Hospital Name</div>
                <div className="col-span-4">Address</div>
                <div className="col-span-2">Students</div>
                <div className="col-span-2">Faculty</div>
              </div>

              {hospitals.map((hospital) => (
                <div key={hospital._id} className="grid grid-cols-12 gap-4 p-4 border-t">
                  <div className="col-span-4 font-medium">{hospital.name}</div>
                  <div className="col-span-4 text-muted-foreground">{hospital.address}</div>
                  <div className="col-span-2 text-muted-foreground">{hospital.studentCount || 0}</div>
                  <div className="col-span-2 text-muted-foreground">{hospital.facultyCount || 0}</div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" size="sm">
              Previous
            </Button>
            <Button variant="outline" size="sm">
              Next
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  )
}

export default AdminDashboard


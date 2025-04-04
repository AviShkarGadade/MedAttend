"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Search, Download, Plus, Trash2, Edit, Filter } from "lucide-react"
import { AdminDashboardHeader } from "@/components/admin-dashboard-header"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { userService, departmentService } from "@/services/api"
import { AlertCircle } from "lucide-react"

export default function AdminUsersPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("students")
  const [searchQuery, setSearchQuery] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [yearFilter, setYearFilter] = useState("all")
  const [showAddUserDialog, setShowAddUserDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [students, setStudents] = useState<any[]>([])
  const [faculty, setFaculty] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    const auth = getAuth()

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user)

        try {
          // Fetch departments for filtering
          const deptResponse = await departmentService.getDepartments()
          setDepartments(deptResponse.data)

          // Fetch students
          const studentsResponse = await userService.getUsers({ role: "student" })
          setStudents(studentsResponse.data)

          // Fetch faculty
          const facultyResponse = await userService.getUsers({ role: "faculty" })
          setFaculty(facultyResponse.data)
        } catch (error) {
          console.error("Error fetching users:", error)
          setError("Failed to load users")
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
  }, [router])

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.studentId && student.studentId.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesDepartment =
      departmentFilter === "all" || (student.department && student.department._id === departmentFilter)

    const matchesYear = yearFilter === "all" || (student.year && student.year.toString() === yearFilter)

    return matchesSearch && matchesDepartment && matchesYear
  })

  const filteredFaculty = faculty.filter((faculty) => {
    const matchesSearch =
      faculty.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faculty.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (faculty.facultyId && faculty.facultyId.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesDepartment =
      departmentFilter === "all" || (faculty.department && faculty.department._id === departmentFilter)

    return matchesSearch && matchesDepartment
  })

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    try {
      await userService.deleteUser(selectedUser._id)

      // Update lists
      if (selectedUser.role === "student") {
        setStudents(students.filter((s) => s._id !== selectedUser._id))
      } else if (selectedUser.role === "faculty") {
        setFaculty(faculty.filter((f) => f._id !== selectedUser._id))
      }

      // Close dialog
      setShowDeleteDialog(false)
      setSelectedUser(null)
    } catch (err: any) {
      setError("Failed to delete user: " + err.message)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminDashboardHeader user={user} />

      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Manage students and faculty accounts</p>
          </div>
          <Button onClick={() => router.push("/admin/add-user")}>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader className="pb-3">
            <Tabs defaultValue="students" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="students">Students</TabsTrigger>
                <TabsTrigger value="faculty">Faculty</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={`Search ${activeTab}...`}
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept._id} value={dept._id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {activeTab === "students" && (
                  <Select value={yearFilter} onValueChange={setYearFilter}>
                    <SelectTrigger className="w-[140px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      {[3, 4, 5, 6, 7].map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          Year {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <Button variant="outline" className="flex gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>

            <TabsContent value="students" className="mt-0">
              <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-12 gap-4 p-4 bg-muted font-medium">
                  <div className="col-span-3">Name</div>
                  <div className="col-span-2">Student ID</div>
                  <div className="col-span-2">Department</div>
                  <div className="col-span-1">Year</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Actions</div>
                </div>

                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <div key={student._id} className="grid grid-cols-12 gap-4 p-4 border-t">
                      <div className="col-span-3">
                        <div className="font-medium">{student.name}</div>
                        <div className="text-sm text-muted-foreground">{student.email}</div>
                      </div>
                      <div className="col-span-2 flex items-center">{student.studentId}</div>
                      <div className="col-span-2 flex items-center">{student.department?.name}</div>
                      <div className="col-span-1 flex items-center">Year {student.year}</div>
                      <div className="col-span-2 flex items-center">
                        {student.isApproved ? (
                          <Badge className="bg-green-500">Active</Badge>
                        ) : (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </div>
                      <div className="col-span-2 flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/admin/users/edit/${student._id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => {
                            setSelectedUser(student)
                            setShowDeleteDialog(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground">No students found matching your filters</div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="faculty" className="mt-0">
              <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-12 gap-4 p-4 bg-muted font-medium">
                  <div className="col-span-3">Name</div>
                  <div className="col-span-2">Faculty ID</div>
                  <div className="col-span-2">Department</div>
                  <div className="col-span-2">Hospital</div>
                  <div className="col-span-1">Status</div>
                  <div className="col-span-2">Actions</div>
                </div>

                {filteredFaculty.length > 0 ? (
                  filteredFaculty.map((faculty) => (
                    <div key={faculty._id} className="grid grid-cols-12 gap-4 p-4 border-t">
                      <div className="col-span-3">
                        <div className="font-medium">{faculty.name}</div>
                        <div className="text-sm text-muted-foreground">{faculty.email}</div>
                      </div>
                      <div className="col-span-2 flex items-center">{faculty.facultyId}</div>
                      <div className="col-span-2 flex items-center">{faculty.department?.name}</div>
                      <div className="col-span-2 flex items-center">{faculty.hospital?.name}</div>
                      <div className="col-span-1 flex items-center">
                        {faculty.isApproved ? (
                          <Badge className="bg-green-500">Active</Badge>
                        ) : (
                          <Badge className="bg-yellow-500">Pending</Badge>
                        )}
                      </div>
                      <div className="col-span-2 flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/admin/users/edit/${faculty._id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => {
                            setSelectedUser(faculty)
                            setShowDeleteDialog(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground">No faculty found matching your filters</div>
                )}
              </div>
            </TabsContent>
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

      {/* Delete User Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedUser && (
              <div className="border rounded-lg p-4">
                <p className="font-medium">{selectedUser.name}</p>
                <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedUser.role === "student"
                    ? `Student ID: ${selectedUser.studentId}`
                    : `Faculty ID: ${selectedUser.facultyId}`}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


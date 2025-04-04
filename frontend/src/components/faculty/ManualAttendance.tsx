"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { attendanceService, userService } from "../../services/api"
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
  Label,
  Alert,
  AlertDescription,
} from "../ui"
import { Search, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react"

interface ManualAttendanceProps {
  session: any
  onClose: () => void
  onSuccess: () => void
}

export const ManualAttendance: React.FC<ManualAttendanceProps> = ({ session, onClose, onSuccess }) => {
  const [students, setStudents] = useState<any[]>([])
  const [filteredStudents, setFilteredStudents] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedStudents, setSelectedStudents] = useState<Record<string, boolean>>({})
  const [attendanceStatus, setAttendanceStatus] = useState<Record<string, string>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true)
        // Fetch students for this session's department and year
        const response = await userService.getUsers({
          role: "student",
          department: session.department._id,
          year: session.year,
        })

        setStudents(response.data)
        setFilteredStudents(response.data)

        // Initialize selected state for all students
        const initialSelected: Record<string, boolean> = {}
        const initialStatus: Record<string, string> = {}
        const initialNotes: Record<string, string> = {}

        response.data.forEach((student: any) => {
          initialSelected[student._id] = false
          initialStatus[student._id] = "present"
          initialNotes[student._id] = ""
        })

        setSelectedStudents(initialSelected)
        setAttendanceStatus(initialStatus)
        setNotes(initialNotes)

        // Fetch existing attendance records for this session
        const attendanceResponse = await attendanceService.getSessionAttendance(session._id, {})

        // Update status for students who already have attendance
        if (attendanceResponse.data) {
          const newStatus = { ...initialStatus }
          const newNotes = { ...initialNotes }

          attendanceResponse.data.forEach((record: any) => {
            if (record.student && record.student._id) {
              newStatus[record.student._id] = record.status
              if (record.notes) {
                newNotes[record.student._id] = record.notes
              }
            }
          })

          setAttendanceStatus(newStatus)
          setNotes(newNotes)
        }
      } catch (err: any) {
        setError("Failed to load students: " + err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
  }, [session])

  useEffect(() => {
    // Filter students based on search query
    if (searchQuery) {
      const filtered = students.filter(
        (student) =>
          student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.studentId.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredStudents(filtered)
    } else {
      setFilteredStudents(students)
    }
  }, [searchQuery, students])

  const handleSelectAll = (checked: boolean) => {
    const newSelected = { ...selectedStudents }
    filteredStudents.forEach((student) => {
      newSelected[student._id] = checked
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

  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      setError(null)

      // Get selected students
      const selectedStudentIds = Object.keys(selectedStudents).filter((id) => selectedStudents[id])

      if (selectedStudentIds.length === 0) {
        setError("Please select at least one student")
        return
      }

      // Prepare attendance records
      const attendanceRecords = selectedStudentIds.map((studentId) => ({
        studentId,
        status: attendanceStatus[studentId],
        notes: notes[studentId],
      }))

      // Submit bulk attendance
      await attendanceService.markBulkAttendance(session._id, attendanceRecords)

      setSuccess("Attendance marked successfully")

      // Notify parent component
      onSuccess()

      // Close after a delay
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (err: any) {
      setError("Failed to mark attendance: " + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Manual Attendance</CardTitle>
        <CardDescription>
          Mark attendance manually for {session.title} on {new Date(session.date).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center ml-4 space-x-2">
            <Checkbox id="select-all" onCheckedChange={(checked) => handleSelectAll(checked === true)} />
            <Label htmlFor="select-all">Select All</Label>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 bg-muted font-medium">
            <div className="col-span-1"></div>
            <div className="col-span-4">Student</div>
            <div className="col-span-2">ID</div>
            <div className="col-span-3">Status</div>
            <div className="col-span-2">Notes</div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading students...</div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No students found</div>
          ) : (
            filteredStudents.map((student) => (
              <div key={student._id} className="grid grid-cols-12 gap-4 p-4 border-t items-center">
                <div className="col-span-1">
                  <Checkbox
                    checked={selectedStudents[student._id]}
                    onCheckedChange={(checked) => handleSelectStudent(student._id, checked === true)}
                  />
                </div>
                <div className="col-span-4 font-medium">{student.name}</div>
                <div className="col-span-2 text-muted-foreground">{student.studentId}</div>
                <div className="col-span-3">
                  <Select
                    value={attendanceStatus[student._id]}
                    onValueChange={(value) => handleStatusChange(student._id, value)}
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
                          <Clock className="h-4 w-4 text-yellow-500 mr-2" />
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
                <div className="col-span-2">
                  <Input
                    placeholder="Notes"
                    value={notes[student._id]}
                    onChange={(e) => handleNotesChange(student._id, e.target.value)}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Saving..." : "Save Attendance"}
        </Button>
      </CardFooter>
    </Card>
  )
}


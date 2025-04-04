import type React from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./contexts/AuthContext"
import ProtectedRoute from "./components/ProtectedRoute"

// Auth pages
import Login from "./pages/Login"
import Register from "./pages/Register"
import PendingApproval from "./pages/PendingApproval"

// Student pages
import StudentDashboard from "./pages/student/Dashboard"
import StudentSchedule from "./pages/student/Schedule"
import StudentAttendance from "./pages/student/Attendance"
import StudentReports from "./pages/student/Reports"
import StudentProfile from "./pages/student/Profile"

// Faculty pages
import FacultyDashboard from "./pages/faculty/Dashboard"
import FacultySessions from "./pages/faculty/Sessions"
import FacultySessionDetail from "./pages/faculty/SessionDetail"
import FacultyCreateSession from "./pages/faculty/CreateSession"
import FacultyStudents from "./pages/faculty/Students"
import FacultyReports from "./pages/faculty/Reports"
import FacultyProfile from "./pages/faculty/Profile"

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard"
import AdminUsers from "./pages/admin/Users"
import AdminAddUser from "./pages/admin/AddUser"
import AdminHospitals from "./pages/admin/Hospitals"
import AdminAddHospital from "./pages/admin/AddHospital"
import AdminReports from "./pages/admin/Reports"
import AdminSettings from "./pages/admin/Settings"
import AdminProfile from "./pages/admin/Profile"

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/pending-approval" element={<PendingApproval />} />

          {/* Student routes */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/schedule"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentSchedule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/attendance"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentAttendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/reports"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/profile"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentProfile />
              </ProtectedRoute>
            }
          />

          {/* Faculty routes */}
          <Route
            path="/faculty/dashboard"
            element={
              <ProtectedRoute allowedRoles={["faculty"]}>
                <FacultyDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/sessions"
            element={
              <ProtectedRoute allowedRoles={["faculty"]}>
                <FacultySessions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/sessions/:id"
            element={
              <ProtectedRoute allowedRoles={["faculty"]}>
                <FacultySessionDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/create-session"
            element={
              <ProtectedRoute allowedRoles={["faculty"]}>
                <FacultyCreateSession />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/students"
            element={
              <ProtectedRoute allowedRoles={["faculty"]}>
                <FacultyStudents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/reports"
            element={
              <ProtectedRoute allowedRoles={["faculty"]}>
                <FacultyReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/profile"
            element={
              <ProtectedRoute allowedRoles={["faculty"]}>
                <FacultyProfile />
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/add-user"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminAddUser />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/hospitals"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminHospitals />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/hospitals/add"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminAddHospital />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminProfile />
              </ProtectedRoute>
            }
          />

          {/* Default route */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App


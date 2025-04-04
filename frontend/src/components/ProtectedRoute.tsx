"use client"

import type React from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles = [] }) => {
  const { currentUser, loading, isAuthenticated } = useAuth()
  const location = useLocation()

  // Show loading state
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  // If not logged in, redirect to login
  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // If roles are specified and user's role is not allowed
  if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
    // Redirect based on user's role
    if (currentUser.role === "admin") {
      return <Navigate to="/admin/dashboard" replace />
    } else if (currentUser.role === "faculty") {
      return <Navigate to="/faculty/dashboard" replace />
    } else if (currentUser.role === "student") {
      return <Navigate to="/student/dashboard" replace />
    }

    // Fallback
    return <Navigate to="/" replace />
  }

  // If faculty is not approved, redirect to pending approval
  if (currentUser.role === "faculty" && !currentUser.isApproved) {
    return <Navigate to="/pending-approval" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute


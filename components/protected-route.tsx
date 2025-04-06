"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles: string[]
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // User is not logged in
        router.push("/login")
      } else if (!allowedRoles.includes(user.role)) {
        // User's role is not allowed
        if (user.role === "admin") {
          router.push("/admin/dashboard")
        } else if (user.role === "faculty") {
          router.push("/faculty/dashboard")
        } else if (user.role === "student") {
          router.push("/student/dashboard")
        } else if (user.role === "pending") {
          router.push("/pending-approval")
        } else {
          router.push("/login")
        }
      }
    }
  }, [user, loading, router, allowedRoles])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return null
  }

  return <>{children}</>
}


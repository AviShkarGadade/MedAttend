"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { getCurrentUser, getIdToken, signOut } from "../services/firebase"
import { authService } from "../services/api"

interface User {
  id: string
  name: string
  email: string
  role: string
  department?: string
  hospital?: string
  studentId?: string
  facultyId?: string
  year?: number
  isApproved: boolean
  profileImage?: string
}

interface AuthContextType {
  currentUser: User | null
  loading: boolean
  error: string | null
  login: (token: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<boolean>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const navigate = useNavigate()

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true)

        // Check if user data exists in localStorage
        const storedUser = localStorage.getItem("user")
        if (storedUser) {
          setCurrentUser(JSON.parse(storedUser))
          setIsAuthenticated(true)
          setLoading(false)
          return // Exit early if we have stored user data
        }

        // Check if Firebase user is logged in
        const firebaseUser = await getCurrentUser()
        if (firebaseUser) {
          const token = await getIdToken(firebaseUser)
          localStorage.setItem("authToken", token)

          // If no stored user data, fetch from API
          try {
            const response = await authService.getCurrentUser()
            setCurrentUser(response.user)
            setIsAuthenticated(true)
            localStorage.setItem("user", JSON.stringify(response.user))
          } catch (err) {
            console.error("Error fetching user data:", err)
            setIsAuthenticated(false)
          }
        } else {
          // No Firebase user, clear any stored data
          setCurrentUser(null)
          setIsAuthenticated(false)
          localStorage.removeItem("authToken")
          localStorage.removeItem("user")
        }
      } catch (err: any) {
        setError(err.message)
        console.error("Auth initialization error:", err)
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = async (token: string) => {
    try {
      setLoading(true)
      setError(null)

      // Save token to localStorage
      localStorage.setItem("authToken", token)

      // Get user data from API
      const response = await authService.login(token)

      // Save user data
      setCurrentUser(response.user)
      setIsAuthenticated(true)
      localStorage.setItem("user", JSON.stringify(response.user))

      // Redirect based on role
      if (response.user.role === "admin") {
        navigate("/admin/dashboard")
      } else if (response.user.role === "faculty") {
        if (response.user.isApproved) {
          navigate("/faculty/dashboard")
        } else {
          navigate("/pending-approval")
        }
      } else if (response.user.role === "student") {
        navigate("/student/dashboard")
      }
    } catch (err: any) {
      setError(err.message)
      setIsAuthenticated(false)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setLoading(true)
      await signOut()
      setCurrentUser(null)
      setIsAuthenticated(false)
      localStorage.removeItem("authToken")
      localStorage.removeItem("user")
      navigate("/login")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const refreshUser = async (): Promise<boolean> => {
    try {
      setLoading(true)
      const response = await authService.getCurrentUser()
      setCurrentUser(response.user)
      localStorage.setItem("user", JSON.stringify(response.user))
      setIsAuthenticated(true)
      return true
    } catch (err: any) {
      console.error("Error refreshing user:", err)
      // Don't automatically sign out or redirect on refresh errors
      return false
    } finally {
      setLoading(false)
    }
  }

  const value = {
    currentUser,
    loading,
    error,
    login,
    logout,
    refreshUser,
    isAuthenticated,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

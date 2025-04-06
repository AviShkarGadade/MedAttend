"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth"
import { auth } from "@/lib/firebase"

// Default mock user data for fallback
const DEFAULT_USER = {
  id: "mock-user-id",
  name: "Test User",
  email: "test@example.com",
  role: "student",
  isApproved: true,
}

interface User {
  id: string
  name: string
  email: string
  role: string
  department?: string
  hospital?: string
  isApproved: boolean
  [key: string]: any
}

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  signOut: () => Promise<void>
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
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check if we have user data in localStorage
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
        setIsAuthenticated(true)
      } catch (err) {
        console.error("Error parsing stored user data:", err)
        localStorage.removeItem("user")
      }
    }

    // Listen for Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // If we already have user data, don't fetch again
        if (user) {
          setLoading(false)
          return
        }

        try {
          // Get ID token
          const idToken = await firebaseUser.getIdToken()

          // Try to get user data from backend
          try {
            const response = await fetch("/api/auth/me", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ token: idToken }),
            })

            if (response.ok) {
              const data = await response.json()
              if (data.user) {
                localStorage.setItem("authToken", idToken)
                localStorage.setItem("user", JSON.stringify(data.user))
                setUser(data.user)
                setIsAuthenticated(true)
              } else {
                // User exists in Firebase but not in our backend
                console.warn("User exists in Firebase but not in backend")

                // Use fallback data
                const fallbackUser = {
                  ...DEFAULT_USER,
                  id: firebaseUser.uid,
                  name: firebaseUser.displayName || "User",
                  email: firebaseUser.email || "unknown@example.com",
                }

                localStorage.setItem("authToken", idToken)
                localStorage.setItem("user", JSON.stringify(fallbackUser))
                setUser(fallbackUser)
                setIsAuthenticated(true)
              }
            } else {
              console.error("Backend verification failed:", await response.text())
              setError("Authentication failed. Please try logging in again.")
              setIsAuthenticated(false)
            }
          } catch (fetchError) {
            console.error("Error fetching user data from backend:", fetchError)

            // Use fallback data if backend is unavailable
            const fallbackUser = {
              ...DEFAULT_USER,
              id: firebaseUser.uid,
              name: firebaseUser.displayName || "User",
              email: firebaseUser.email || "unknown@example.com",
            }

            localStorage.setItem("authToken", idToken)
            localStorage.setItem("user", JSON.stringify(fallbackUser))
            setUser(fallbackUser)
            setIsAuthenticated(true)
          }
        } catch (error) {
          console.error("Error getting ID token:", error)
          setError("Authentication error. Please try logging in again.")
          setIsAuthenticated(false)
        }
      } else {
        // No Firebase user
        setUser(null)
        setIsAuthenticated(false)
        localStorage.removeItem("authToken")
        localStorage.removeItem("user")
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signOut = async () => {
    try {
      setLoading(true)
      await firebaseSignOut(auth)
      setUser(null)
      setIsAuthenticated(false)
      localStorage.removeItem("authToken")
      localStorage.removeItem("user")
    } catch (err: any) {
      setError(err.message || "Error signing out")
      console.error("Sign out error:", err)
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    loading,
    error,
    signOut,
    isAuthenticated,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}


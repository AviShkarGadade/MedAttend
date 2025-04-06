"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth"
import { useRouter, usePathname } from "next/navigation"
import { auth } from "@/lib/firebase"

interface AuthContextType {
  user: any | null
  firebaseUser: FirebaseUser | null
  loading: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  error: null,
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [user, setUser] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!auth) return

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser)

      if (fbUser) {
        try {
          // Get stored user data first for immediate UI update
          const storedUser = localStorage.getItem("user")
          if (storedUser) {
            try {
              setUser(JSON.parse(storedUser))
            } catch (e) {
              console.error("Error parsing stored user:", e)
              localStorage.removeItem("user")
            }
          }

          // Then verify with backend
          const idToken = await fbUser.getIdToken()
          localStorage.setItem("authToken", idToken)

          const response = await fetch("/api/auth/me", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: idToken }),
          })

          if (response.ok) {
            const data = await response.json()
            if (data.user) {
              setUser(data.user)
              localStorage.setItem("user", JSON.stringify(data.user))

              // Handle redirects for authenticated users
              if (pathname === "/login" || pathname === "/register" || pathname === "/") {
                if (data.user.role === "admin") {
                  router.push("/admin/dashboard")
                } else if (data.user.role === "faculty") {
                  router.push("/faculty/dashboard")
                } else if (data.user.role === "student") {
                  router.push("/student/dashboard")
                } else if (data.user.role === "pending") {
                  router.push("/pending-approval")
                }
              }
            }
          } else {
            // If backend verification fails but we have Firebase user
            // Keep the user logged in with limited functionality
            console.error("Backend verification failed:", await response.text())
            setError("Backend verification failed")
          }
        } catch (err) {
          console.error("Error verifying user:", err)
          setError("Error verifying user")
        }
      } else {
        // User is not logged in
        setUser(null)
        localStorage.removeItem("authToken")
        localStorage.removeItem("user")

        // Redirect to login for protected routes
        const protectedRoutes = ["/admin", "/faculty", "/student", "/pending-approval"]

        if (protectedRoutes.some((route) => pathname?.startsWith(route))) {
          router.push("/login")
        }
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [router, pathname])

  return <AuthContext.Provider value={{ user, firebaseUser, loading, error }}>{children}</AuthContext.Provider>
}


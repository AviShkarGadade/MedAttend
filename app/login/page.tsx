"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Hospital, Mail, Lock, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
// Import Firebase modules individually to avoid webpack issues
import { initializeApp } from "firebase/app"
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth"

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const googleProvider = new GoogleAuthProvider()

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  // Check if user is already logged in
  useEffect(() => {
    // Clear any potential loop detection from previous sessions
    sessionStorage.removeItem("auth_redirect_count")

    const checkAuthStatus = async () => {
      try {
        // Check if we have user data in localStorage
        const storedUser = localStorage.getItem("user")
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser)
            setIsAuthenticated(true)
            setInitialLoading(false)

            // Don't auto-redirect here - let the user choose
            return
          } catch (err) {
            console.error("Error parsing stored user data:", err)
            localStorage.removeItem("user")
          }
        }

        // If no stored user, check Firebase auth state
        const auth = getAuth()
        const user = auth.currentUser

        if (user) {
          try {
            // Get ID token
            const idToken = await user.getIdToken()

            // Verify with backend
            const response = await fetch("/api/auth/me", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ token: idToken }),
            })

            if (response.ok) {
              const data = await response.json()
              localStorage.setItem("authToken", idToken)
              localStorage.setItem("user", JSON.stringify(data.user))
              setIsAuthenticated(true)
            } else {
              // Invalid token or user not found - clear auth data
              localStorage.removeItem("authToken")
              localStorage.removeItem("user")
              setIsAuthenticated(false)
            }
          } catch (error) {
            console.error("Error checking auth status:", error)
            setIsAuthenticated(false)
          }
        } else {
          setIsAuthenticated(false)
        }

        setInitialLoading(false)
      } catch (error) {
        console.error("Error in auth check:", error)
        setInitialLoading(false)
        setIsAuthenticated(false)
      }
    }

    checkAuthStatus()
  }, [])

  const redirectBasedOnRole = (role) => {
    // Get current redirect count to prevent loops
    const redirectCount = Number.parseInt(sessionStorage.getItem("auth_redirect_count") || "0")

    // If we've redirected too many times, don't redirect again
    if (redirectCount > 3) {
      console.error("Too many redirects detected - possible redirect loop")
      sessionStorage.removeItem("auth_redirect_count")
      setError("Login error: Too many redirects detected. Please try again later.")
      return
    }

    // Increment redirect count
    sessionStorage.setItem("auth_redirect_count", (redirectCount + 1).toString())

    // Redirect based on role
    switch (role) {
      case "admin":
        router.push("/admin/dashboard")
        break
      case "faculty":
        router.push("/faculty/dashboard")
        break
      case "student":
        router.push("/student/dashboard")
        break
      default:
        router.push("/")
    }
  }

  const handleEmailLogin = async (e) => {
    e.preventDefault()

    try {
      setLoading(true)
      setError("")

      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password)

      // Get ID token
      const idToken = await userCredential.user.getIdToken()

      // Call backend to verify user and get role
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: idToken }),
      })

      const data = await response.json()

      if (response.ok) {
        // Store user data in localStorage for persistence
        localStorage.setItem("authToken", idToken)
        localStorage.setItem("user", JSON.stringify(data.user))
        setIsAuthenticated(true)

        // Reset redirect count before redirecting
        sessionStorage.setItem("auth_redirect_count", "0")

        // Redirect based on user role
        redirectBasedOnRole(data.user.role)
      } else {
        setError(data.message || "Failed to authenticate")
      }
    } catch (err) {
      setError(err.message || "Failed to login")
      console.error("Login error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      setError("")

      // Sign in with Google
      const result = await signInWithPopup(auth, googleProvider)

      // Get ID token
      const idToken = await result.user.getIdToken()

      // Call backend to verify user and get role
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: idToken }),
      })

      const data = await response.json()

      if (response.ok) {
        // Store user data in localStorage for persistence
        localStorage.setItem("authToken", idToken)
        localStorage.setItem("user", JSON.stringify(data.user))
        setIsAuthenticated(true)

        // Reset redirect count before redirecting
        sessionStorage.setItem("auth_redirect_count", "0")

        // Redirect based on user role
        redirectBasedOnRole(data.user.role)
      } else {
        setError(data.message || "Failed to authenticate")
      }
    } catch (err) {
      setError(err.message || "Failed to login with Google")
      console.error("Google login error:", err)
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <Hospital className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Sign in to MedAttend</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>

          {isAuthenticated && (
            <Alert className="mt-4 bg-green-50 border-green-200">
              <AlertCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700">
                You are already signed in. Choose an option below.
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isAuthenticated ? (
            <div className="space-y-4">
              <Button
                className="w-full"
                onClick={() => {
                  const userData = JSON.parse(localStorage.getItem("user") || "{}")
                  redirectBasedOnRole(userData.role || "student")
                }}
              >
                Go to Dashboard
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  localStorage.removeItem("authToken")
                  localStorage.removeItem("user")
                  setIsAuthenticated(false)
                }}
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <>
              <form onSubmit={handleEmailLogin}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="m.smith@example.com"
                        className="pl-10"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        className="pl-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </div>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <Button variant="outline" type="button" className="w-full" onClick={handleGoogleLogin} disabled={loading}>
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </Button>
            </>
          )}
        </CardContent>
        <CardFooter className="text-center">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}


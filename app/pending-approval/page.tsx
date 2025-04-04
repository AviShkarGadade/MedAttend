"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Hospital, CheckCircle, Clock, LogOut } from "lucide-react"
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth"

export default function PendingApprovalPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const auth = getAuth()

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user)
        setLoading(false)
      } else {
        // User is not logged in
        router.push("/login")
      }
    })

    // Cleanup subscription
    return () => unsubscribe()
  }, [router])

  const handleSignOut = async () => {
    const auth = getAuth()
    try {
      await signOut(auth)
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Hospital className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Account Pending Approval</CardTitle>
          <CardDescription>Your faculty account is awaiting administrator approval</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center p-6 bg-muted rounded-lg">
            <div className="flex flex-col items-center text-center">
              <Clock className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="font-medium">Your account is being reviewed</p>
              <p className="text-sm text-muted-foreground mt-1">This process typically takes 1-2 business days</p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">What happens next?</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                <span>An administrator will review your faculty credentials</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                <span>You'll receive an email notification once your account is approved</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                <span>After approval, you can log in and access the faculty dashboard</span>
              </li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button variant="outline" className="w-full" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-2">
            If you have any questions, please contact{" "}
            <a href="mailto:support@medattend.com" className="text-primary hover:underline">
              support@medattend.com
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}


"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Hospital, AlertCircle, ArrowRight } from "lucide-react"
import Link from "next/link"

interface DashboardFallbackProps {
  role: string
  error?: string
  onRetry?: () => void
}

export function DashboardFallback({ role, error, onRetry }: DashboardFallbackProps) {
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    if (!onRetry) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          onRetry()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [onRetry])

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <Hospital className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Dashboard Loading</CardTitle>
          <CardDescription>
            {role === "admin" ? "Admin Dashboard" : role === "faculty" ? "Faculty Dashboard" : "Student Dashboard"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <p className="text-center">
            {error
              ? "There was an error loading your dashboard. This could be due to network issues or server problems."
              : "Loading your dashboard..."}
          </p>

          {onRetry && <p className="text-center text-sm text-muted-foreground">Retrying in {countdown} seconds...</p>}

          <div className="flex flex-col space-y-2">
            {error && onRetry && <Button onClick={onRetry}>Retry Now</Button>}

            <Link href="/login" passHref>
              <Button variant="outline" className="w-full">
                Back to Login
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


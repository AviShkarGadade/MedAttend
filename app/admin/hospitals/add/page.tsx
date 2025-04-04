"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AdminDashboardHeader } from "@/components/admin-dashboard-header"
import { hospitalService } from "@/services/api"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { AlertCircle, CheckCircle2 } from "lucide-react"

export default function AddHospitalPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form fields
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [zipCode, setZipCode] = useState("")
  const [latitude, setLatitude] = useState("")
  const [longitude, setLongitude] = useState("")

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSubmitting(true)
      setError(null)

      // Validate form
      if (!name || !address || !city || !state || !zipCode || !latitude || !longitude) {
        setError("Please fill in all required fields")
        return
      }

      // Validate coordinates
      const lat = Number.parseFloat(latitude)
      const lng = Number.parseFloat(longitude)

      if (isNaN(lat) || isNaN(lng)) {
        setError("Latitude and longitude must be valid numbers")
        return
      }

      // Prepare hospital data
      const hospitalData = {
        name,
        address,
        city,
        state,
        zipCode,
        coordinates: {
          latitude: lat,
          longitude: lng,
        },
      }

      // Create hospital
      await hospitalService.createHospital(hospitalData)

      // Show success message
      setSuccess("Hospital created successfully")

      // Reset form
      setName("")
      setAddress("")
      setCity("")
      setState("")
      setZipCode("")
      setLatitude("")
      setLongitude("")

      // Redirect after a delay
      setTimeout(() => {
        router.push("/admin/hospitals")
      }, 2000)
    } catch (err: any) {
      setError(err.message || "Failed to create hospital")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminDashboardHeader user={user} />

      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Add New Hospital</h1>
            <p className="text-muted-foreground">Create a new hospital location</p>
          </div>
          <Button variant="outline" onClick={() => router.push("/admin/hospitals")}>
            Cancel
          </Button>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Hospital Information</CardTitle>
            <CardDescription>Enter the details for the new hospital</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-6 bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-700">{success}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Hospital Name</Label>
                  <Input
                    id="name"
                    placeholder="City General Hospital"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    placeholder="123 Main Street"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="Cityville"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      placeholder="State"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zipCode">Zip Code</Label>
                    <Input
                      id="zipCode"
                      placeholder="12345"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      placeholder="40.7128"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      placeholder="-74.0060"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <CardFooter className="px-0 pt-4">
                <Button type="submit" className="ml-auto" disabled={submitting}>
                  {submitting ? "Creating..." : "Create Hospital"}
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}


"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Download, Plus, Trash2, Edit, MapPin } from "lucide-react"
import { AdminDashboardHeader } from "@/components/admin-dashboard-header"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { hospitalService } from "@/services/api"
import { AlertCircle } from "lucide-react"

export default function AdminHospitalsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedHospital, setSelectedHospital] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [hospitals, setHospitals] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    const auth = getAuth()

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user)

        try {
          // Fetch hospitals
          const response = await hospitalService.getHospitals()
          setHospitals(response.data)
        } catch (error) {
          console.error("Error fetching hospitals:", error)
          setError("Failed to load hospitals")
        } finally {
          setLoading(false)
        }
      } else {
        // User is not logged in
        router.push("/login")
      }
    })

    // Cleanup subscription
    return () => unsubscribe()
  }, [router])

  const filteredHospitals = hospitals.filter((hospital) => {
    return (
      hospital.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hospital.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hospital.city.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  const handleDeleteHospital = async () => {
    if (!selectedHospital) return

    try {
      await hospitalService.deleteHospital(selectedHospital._id)

      // Update list
      setHospitals(hospitals.filter((h) => h._id !== selectedHospital._id))

      // Close dialog
      setShowDeleteDialog(false)
      setSelectedHospital(null)
    } catch (err: any) {
      setError("Failed to delete hospital: " + err.message)
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
            <h1 className="text-2xl font-bold">Hospital Management</h1>
            <p className="text-muted-foreground">Manage hospital locations</p>
          </div>
          <Button onClick={() => router.push("/admin/hospitals/add")}>
            <Plus className="h-4 w-4 mr-2" />
            Add Hospital
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Hospitals</CardTitle>
            <CardDescription>View and manage hospital locations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search hospitals..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Button variant="outline" className="flex gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-12 gap-4 p-4 bg-muted font-medium">
                <div className="col-span-3">Hospital Name</div>
                <div className="col-span-4">Address</div>
                <div className="col-span-3">Location</div>
                <div className="col-span-2">Actions</div>
              </div>

              {filteredHospitals.length > 0 ? (
                filteredHospitals.map((hospital) => (
                  <div key={hospital._id} className="grid grid-cols-12 gap-4 p-4 border-t">
                    <div className="col-span-3 font-medium">{hospital.name}</div>
                    <div className="col-span-4">
                      <div>{hospital.address}</div>
                      <div className="text-sm text-muted-foreground">
                        {hospital.city}, {hospital.state} {hospital.zipCode}
                      </div>
                    </div>
                    <div className="col-span-3">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {hospital.coordinates.latitude.toFixed(4)}, {hospital.coordinates.longitude.toFixed(4)}
                      </Badge>
                    </div>
                    <div className="col-span-2 flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/admin/hospitals/edit/${hospital._id}`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => {
                          setSelectedHospital(hospital)
                          setShowDeleteDialog(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-muted-foreground">No hospitals found matching your search</div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" size="sm">
              Previous
            </Button>
            <Button variant="outline" size="sm">
              Next
            </Button>
          </CardFooter>
        </Card>
      </main>

      {/* Delete Hospital Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this hospital? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedHospital && (
              <div className="border rounded-lg p-4">
                <p className="font-medium">{selectedHospital.name}</p>
                <p className="text-sm text-muted-foreground">{selectedHospital.address}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedHospital.city}, {selectedHospital.state} {selectedHospital.zipCode}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteHospital}>
              Delete Hospital
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


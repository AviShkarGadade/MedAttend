import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Hospital, Users, ClipboardCheck, BarChart3 } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Hospital className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">MedAttend</span>
          </div>
          <div className="space-x-2">
            <Link href="/login">
              <Button variant="outline">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Register</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <section className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4">Medical Rotation Attendance Management</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Streamline attendance tracking for medical interns across multiple hospital rotations with geolocation and
            QR code verification.
          </p>
        </section>

        <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Role-Based Access</CardTitle>
              <CardDescription>Separate interfaces for admin, faculty, and students</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Hospital className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Multi-Hospital Support</CardTitle>
              <CardDescription>Track attendance across different hospital locations</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <ClipboardCheck className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Verified Attendance</CardTitle>
              <CardDescription>Geolocation and QR code verification for accurate tracking</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Comprehensive Reports</CardTitle>
              <CardDescription>Detailed attendance analytics and reporting</CardDescription>
            </CardHeader>
          </Card>
        </section>

        <section className="bg-muted rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to get started?</h2>
          <div className="flex justify-center gap-4">
            <Link href="/register">
              <Button size="lg">Sign Up Now</Button>
            </Link>
            <Link href="/about">
              <Button variant="outline" size="lg">
                Learn More
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-muted py-6">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 MedAttend. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

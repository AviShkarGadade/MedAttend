"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Hospital, Menu, Bell, User, LogOut, Settings } from "lucide-react"
import { getAuth, signOut } from "firebase/auth"
import { useRouter } from "next/navigation"

interface StudentDashboardHeaderProps {
  user: {
    name: string
    id: string
    department: string
    year: number
  }
}

export function StudentDashboardHeader({ user }: StudentDashboardHeaderProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    const auth = getAuth()
    try {
      await signOut(auth)
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <header className="bg-white border-b sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/student/dashboard" className="flex items-center space-x-2 mr-6">
            <Hospital className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">MedAttend</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/student/dashboard" className="text-sm font-medium">
              Dashboard
            </Link>
            <Link href="/student/schedule" className="text-sm font-medium text-muted-foreground">
              Schedule
            </Link>
            <Link href="/student/attendance" className="text-sm font-medium text-muted-foreground">
              My Attendance
            </Link>
            <Link href="/student/reports" className="text-sm font-medium text-muted-foreground">
              Reports
            </Link>
          </nav>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            <span className="sr-only">Notifications</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">ID: {user.id}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/student/dashboard">Dashboard</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/student/schedule">Schedule</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/student/attendance">My Attendance</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/student/reports">Reports</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}


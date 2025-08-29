"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Hospital, Menu, Bell, User, LogOut, Settings, Shield } from "lucide-react"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"

interface AdminDashboardHeaderProps {
  user: any
}

export function AdminDashboardHeader({ user }: AdminDashboardHeaderProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      if (auth) {
        await signOut(auth)
      }
      localStorage.removeItem("authToken")
      localStorage.removeItem("user")
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <header className="bg-white border-b sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/admin/dashboard" className="flex items-center space-x-2 mr-6">
            <Hospital className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">MedAttend</span>
            <Badge variant="outline" className="ml-2 bg-primary/10 text-primary">
              <Shield className="h-3 w-3 mr-1" />
              Admin
            </Badge>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/admin/dashboard" className="text-sm font-medium">
              Dashboard
            </Link>
            <Link href="/admin/users" className="text-sm font-medium text-muted-foreground">
              Users
            </Link>
            <Link href="/admin/hospitals" className="text-sm font-medium text-muted-foreground">
              Hospitals
            </Link>
            <Link href="/admin/reports" className="text-sm font-medium text-muted-foreground">
              Reports
            </Link>
            <Link href="/admin/settings" className="text-sm font-medium text-muted-foreground">
              Settings
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
                  <p className="font-medium">{user?.name || "Admin User"}</p>
                  <p className="text-xs text-muted-foreground">{user?.role || "admin"}</p>
                  <p className="text-xs text-muted-foreground">{user?.department || "System Administration"}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
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
                <Link href="/admin/dashboard">Dashboard</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/users">Users</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/hospitals">Hospitals</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/reports">Reports</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/settings">Settings</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}


"use client"

import type React from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import {
  Button,
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui"
import { Hospital, Menu, Bell, User, LogOut, Settings, Shield } from "lucide-react"

interface AdminDashboardHeaderProps {
  user: any
}

export const AdminDashboardHeader: React.FC<AdminDashboardHeaderProps> = ({ user }) => {
  const { logout } = useAuth()

  const handleSignOut = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <header className="bg-white border-b sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Link to="/admin/dashboard" className="flex items-center space-x-2 mr-6">
            <Hospital className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">MedAttend</span>
            <Badge variant="outline" className="ml-2 bg-primary/10 text-primary">
              <Shield className="h-3 w-3 mr-1" />
              Admin
            </Badge>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/admin/dashboard" className="text-sm font-medium">
              Dashboard
            </Link>
            <Link to="/admin/users" className="text-sm font-medium text-muted-foreground">
              Users
            </Link>
            <Link to="/admin/hospitals" className="text-sm font-medium text-muted-foreground">
              Hospitals
            </Link>
            <Link to="/admin/reports" className="text-sm font-medium text-muted-foreground">
              Reports
            </Link>
            <Link to="/admin/settings" className="text-sm font-medium text-muted-foreground">
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
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.role}</p>
                  <p className="text-xs text-muted-foreground">{user.department}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/admin/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/admin/settings">
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
                <Link to="/admin/dashboard">Dashboard</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/admin/users">Users</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/admin/hospitals">Hospitals</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/admin/reports">Reports</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/admin/settings">Settings</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

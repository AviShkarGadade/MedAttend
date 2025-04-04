"use client"

import type React from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Button } from "../ui"

interface QRCodeDisplayProps {
  session: any
  onClose: () => void
  onRefresh: () => void
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ session, onClose, onRefresh }) => {
  // Format expiry time
  const formatExpiryTime = () => {
    if (!session.qrCodeExpiry) return "Unknown"

    const expiry = new Date(session.qrCodeExpiry)
    const now = new Date()

    // Calculate minutes remaining
    const minutesRemaining = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60))

    if (minutesRemaining <= 0) {
      return "Expired"
    } else if (minutesRemaining === 1) {
      return "1 minute remaining"
    } else {
      return `${minutesRemaining} minutes remaining`
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Attendance QR Code</CardTitle>
          <CardDescription>Students can scan this QR code to mark their attendance</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <div className="bg-white p-4 rounded-lg mb-4">
            {session.qrCode ? (
              <img src={session.qrCode || "/placeholder.svg"} alt="QR Code" className="w-64 h-64" />
            ) : (
              <div className="w-64 h-64 bg-muted flex items-center justify-center">
                <p>QR Code not available</p>
              </div>
            )}
          </div>
          <div className="text-center space-y-2">
            <p className="font-medium">{session.title}</p>
            <p className="text-sm text-muted-foreground">{formatExpiryTime()}</p>
            <p className="text-sm text-muted-foreground">Session ID: {session._id}</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onRefresh}>Refresh Code</Button>
        </CardFooter>
      </Card>
    </div>
  )
}


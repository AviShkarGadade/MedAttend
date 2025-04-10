"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button, Alert, AlertDescription } from "../ui"
import { MapPin, Loader2 } from "lucide-react"

interface GeolocationAttendanceProps {
  session: any
  onSubmit: (location: { latitude: number; longitude: number }) => void
}

export const GeolocationAttendance: React.FC<GeolocationAttendanceProps> = ({ session, onSubmit }) => {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [distance, setDistance] = useState<number | null>(null)

  useEffect(() => {
    // Get current location when component mounts
    getCurrentLocation()
  }, [])

  const getCurrentLocation = () => {
    setLoading(true)
    setError(null)

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser")
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setLocation({ latitude, longitude })

        // Calculate distance from session location
        if (session.coordinates) {
          const dist = calculateDistance(
            { latitude, longitude },
            { latitude: session.coordinates.latitude, longitude: session.coordinates.longitude },
          )
          setDistance(dist)
        }

        setLoading(false)
      },
      (error) => {
        let errorMessage = "Failed to get your location"

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "You denied the request for geolocation"
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable"
            break
          case error.TIMEOUT:
            errorMessage = "The request to get your location timed out"
            break
        }

        setError(errorMessage)
        setLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    )
  }

  const calculateDistance = (
    coords1: { latitude: number; longitude: number },
    coords2: { latitude: number; longitude: number },
  ): number => {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = (coords1.latitude * Math.PI) / 180
    const φ2 = (coords2.latitude * Math.PI) / 180
    const Δφ = ((coords2.latitude - coords1.latitude) * Math.PI) / 180
    const Δλ = ((coords2.longitude - coords1.longitude) * Math.PI) / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c

    return distance
  }

  const handleSubmit = () => {
    if (location) {
      onSubmit(location)
    }
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-muted rounded-lg">
        <h3 className="font-medium mb-2">{session.title}</h3>
        <p className="text-sm text-muted-foreground">
          {new Date(session.date).toLocaleDateString()} | {session.startTime} - {session.endTime}
        </p>
        <p className="text-sm text-muted-foreground flex items-center mt-1">
          <MapPin className="h-4 w-4 mr-1" />
          {session.location}
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
        {loading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p>Getting your location...</p>
          </div>
        ) : location ? (
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <p className="font-medium">Location detected</p>
            <p className="text-sm text-muted-foreground mb-2">
              Lat: {location.latitude.toFixed(6)}, Lng: {location.longitude.toFixed(6)}
            </p>

            {distance !== null && (
              <p
                className={`text-sm font-medium ${
                  distance <= (session.radius || 100) ? "text-green-500" : "text-red-500"
                }`}
              >
                {distance <= (session.radius || 100)
                  ? `You are within range (${Math.round(distance)}m)`
                  : `You are ${Math.round(distance)}m away from the session location. Maximum allowed distance is ${session.radius || 100}m.`}
              </p>
            )}
          </div>
        ) : (
          <div className="text-center">
            <p>No location data available</p>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={getCurrentLocation} disabled={loading}>
          Refresh Location
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading || !location || (distance !== null && distance > (session.radius || 100))}
        >
          Mark Attendance
        </Button>
      </div>
    </div>
  )
}

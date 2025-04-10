import { OpenCage } from "opencage-api-client"

// Initialize OpenCage with API key
const opencage = new OpenCage({ key: process.env.OPENCAGE_API_KEY || "" })

interface Coordinates {
  latitude: number
  longitude: number
}

interface LocationInfo {
  address: string
  city: string
  state: string
  country: string
  formattedAddress: string
}

/**
 * Get location information from coordinates
 */
export async function getLocationFromCoordinates(coords: Coordinates): Promise<LocationInfo | null> {
  try {
    const { results } = await opencage.geocode({
      q: `${coords.latitude}, ${coords.longitude}`,
      no_annotations: 1,
    })

    if (results && results.length > 0) {
      const result = results[0]
      const components = result.components

      return {
        address: components.road || "",
        city: components.city || components.town || components.village || "",
        state: components.state || "",
        country: components.country || "",
        formattedAddress: result.formatted,
      }
    }

    return null
  } catch (error) {
    console.error("Error getting location from coordinates:", error)
    return null
  }
}

/**
 * Calculate distance between two coordinates in meters
 */
export function calculateDistance(coords1: Coordinates, coords2: Coordinates): number {
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

/**
 * Check if user is within the allowed radius of a location
 */
export function isWithinRadius(userCoords: Coordinates, locationCoords: Coordinates, radiusInMeters = 100): boolean {
  const distance = calculateDistance(userCoords, locationCoords)
  return distance <= radiusInMeters
}

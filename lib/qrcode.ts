import QRCode from "qrcode"
import crypto from "crypto"

/**
 * Generate a secure token for QR code
 */
export function generateSecureToken(sessionId: string, expiryMinutes = 10): string {
  // Create a payload with session ID and expiry time
  const expiryTime = Date.now() + expiryMinutes * 60 * 1000
  const payload = {
    sessionId,
    expiryTime,
    nonce: crypto.randomBytes(8).toString("hex"), // Add randomness
  }

  // Convert payload to string
  const payloadStr = JSON.stringify(payload)

  // Create HMAC signature using server secret
  const hmac = crypto.createHmac("sha256", process.env.QR_SECRET_KEY || "default-secret-key")
  const signature = hmac.update(payloadStr).digest("hex")

  // Combine payload and signature
  const token = Buffer.from(
    JSON.stringify({
      payload: payloadStr,
      signature,
    }),
  ).toString("base64")

  return token
}

/**
 * Verify a QR code token
 */
export function verifyToken(token: string): { valid: boolean; sessionId?: string; expired?: boolean } {
  try {
    // Decode token
    const decoded = JSON.parse(Buffer.from(token, "base64").toString())
    const { payload, signature } = decoded

    // Verify signature
    const hmac = crypto.createHmac("sha256", process.env.QR_SECRET_KEY || "default-secret-key")
    const expectedSignature = hmac.update(payload).digest("hex")

    if (signature !== expectedSignature) {
      return { valid: false }
    }

    // Parse payload
    const { sessionId, expiryTime } = JSON.parse(payload)

    // Check if token has expired
    if (Date.now() > expiryTime) {
      return { valid: false, expired: true }
    }

    return { valid: true, sessionId }
  } catch (error) {
    console.error("Error verifying token:", error)
    return { valid: false }
  }
}

/**
 * Generate QR code as data URL
 */
export async function generateQRCode(sessionId: string, expiryMinutes = 10): Promise<string> {
  const token = generateSecureToken(sessionId, expiryMinutes)

  try {
    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(token, {
      errorCorrectionLevel: "H",
      margin: 1,
      width: 300,
    })

    return qrCodeDataUrl
  } catch (error) {
    console.error("Error generating QR code:", error)
    throw error
  }
}


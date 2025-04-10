"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { Alert, AlertDescription } from "../ui"

interface QRCodeScannerProps {
  onScan: (data: string) => void
}

export const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ onScan }) => {
  const [error, setError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [html5QrCode, setHtml5QrCode] = useState<Html5Qrcode | null>(null)

  useEffect(() => {
    // Initialize scanner
    const qrCodeScanner = new Html5Qrcode("qr-reader")
    setHtml5QrCode(qrCodeScanner)

    // Start scanning
    startScanner(qrCodeScanner)

    // Cleanup on unmount
    return () => {
      if (qrCodeScanner && scanning) {
        qrCodeScanner.stop().catch((error) => {
          console.error("Error stopping QR scanner:", error)
        })
      }
    }
  }, [])

  const startScanner = async (scanner: Html5Qrcode) => {
    try {
      setScanning(true)
      setError(null)

      const qrCodeSuccessCallback = (decodedText: string) => {
        // Stop scanning
        scanner.stop().catch((error) => {
          console.error("Error stopping QR scanner:", error)
        })

        // Call the onScan callback with the decoded text
        onScan(decodedText)
      }

      const qrCodeErrorCallback = (error: any) => {
        console.error("QR scan error:", error)
      }

      // Start scanning
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        qrCodeSuccessCallback,
        qrCodeErrorCallback,
      )
    } catch (err: any) {
      setScanning(false)
      setError(err.message || "Failed to start camera")
      console.error("Error starting QR scanner:", err)
    }
  }

  return (
    <div className="w-full">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div id="qr-reader" className="w-full aspect-square rounded-lg overflow-hidden mb-4"></div>

      <p className="text-sm text-muted-foreground mb-4 text-center">Position the QR code within the frame to scan</p>
    </div>
  )
}

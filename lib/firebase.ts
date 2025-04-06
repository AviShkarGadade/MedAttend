import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { getAuth, type Auth } from "firebase/auth"

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase
let firebaseApp: FirebaseApp | undefined
let firebaseAuth: Auth | undefined

export function getFirebaseApp() {
  if (typeof window !== "undefined") {
    if (!firebaseApp) {
      if (!getApps().length) {
        firebaseApp = initializeApp(firebaseConfig)
      } else {
        firebaseApp = getApps()[0]
      }
    }
    return firebaseApp
  }
  return undefined
}

export function getFirebaseAuth() {
  if (typeof window !== "undefined") {
    if (!firebaseAuth) {
      const app = getFirebaseApp()
      if (app) {
        firebaseAuth = getAuth(app)
      }
    }
    return firebaseAuth
  }
  return undefined
}

// Export the initialized instances
export const app = getFirebaseApp()
export const auth = getFirebaseAuth()


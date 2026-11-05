import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const firebaseConfigured = Boolean(config.apiKey && config.projectId && config.appId)

let app: FirebaseApp | null = null
let authInstance: Auth | null = null
let dbInstance: Firestore | null = null

if (firebaseConfigured) {
  try {
    app = initializeApp(config as Required<typeof config>)
    authInstance = getAuth(app)
    dbInstance = getFirestore(app)
  } catch (error) {
    console.error('[firebase] No se pudo inicializar Firebase, se usará modo local.', error)
    app = null
    authInstance = null
    dbInstance = null
  }
}

export const firebaseApp = app
export const firebaseAuth = authInstance
export const firestore = dbInstance
export const usingFirebase = Boolean(authInstance && dbInstance)

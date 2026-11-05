import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { firebaseAuth, usingFirebase } from '../lib/firebase'

export interface AppUser {
  uid: string
  email: string
  displayName: string
  photoURL: string | null
  local: boolean
}

interface AuthContextValue {
  user: AppUser | null
  loading: boolean
  mode: 'firebase' | 'local'
  error: string | null
  clearError: () => void
  signIn: (email: string, password: string) => Promise<void>
  signUp: (name: string, email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOutUser: () => Promise<void>
}

const SESSION_KEY = 'audiomods:session'
const USERS_KEY = 'audiomods:local-users'

interface LocalAccount {
  uid: string
  email: string
  displayName: string
  passwordHash: string
}

const AuthContext = createContext<AuthContextValue | null>(null)

function hashPassword(value: string): string {
  let hash = 5381
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 33) ^ value.charCodeAt(i)
  }
  return (hash >>> 0).toString(36)
}

function readLocalAccounts(): LocalAccount[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as LocalAccount[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeLocalAccounts(accounts: LocalAccount[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(accounts))
}

function readLocalSession(): AppUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AppUser
    if (!parsed?.uid) return null
    return { ...parsed, local: true }
  } catch {
    return null
  }
}

function toAppUser(user: User): AppUser {
  return {
    uid: user.uid,
    email: user.email ?? '',
    displayName: user.displayName ?? user.email?.split('@')[0] ?? 'Oyente',
    photoURL: user.photoURL,
    local: false,
  }
}

function mapFirebaseError(error: unknown): string {
  const code = (error as { code?: string })?.code ?? ''
  switch (code) {
    case 'auth/invalid-email':
      return 'El correo no tiene un formato válido.'
    case 'auth/missing-password':
    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres.'
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Correo o contraseña incorrectos.'
    case 'auth/email-already-in-use':
      return 'Ya existe una cuenta con ese correo.'
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Prueba de nuevo en unos minutos.'
    case 'auth/popup-closed-by-user':
      return 'Cerraste la ventana de Google antes de terminar.'
    case 'auth/operation-not-allowed':
      return 'Ese método de acceso no está habilitado en Firebase.'
    case 'auth/network-request-failed':
      return 'Sin conexión con Firebase. Revisa tu red.'
    default:
      return 'No pudimos completar la operación. Inténtalo de nuevo.'
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (usingFirebase && firebaseAuth) {
      let settled = false
      const unsubscribe = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
        settled = true
        setUser(firebaseUser ? toAppUser(firebaseUser) : null)
        setLoading(false)
      })
      // Red de seguridad: si Firebase no responde (red bloqueada, iframe, etc.)
      // el splash nunca debe quedarse colgado.
      const failSafe = window.setTimeout(() => {
        if (!settled) setLoading(false)
      }, 5000)
      return () => {
        window.clearTimeout(failSafe)
        unsubscribe()
      }
    }
    setUser(readLocalSession())
    const timer = window.setTimeout(() => setLoading(false), 180)
    return () => window.clearTimeout(timer)
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null)
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !password) {
      setError('Introduce tu correo y contraseña.')
      return
    }

    if (usingFirebase && firebaseAuth) {
      try {
        await signInWithEmailAndPassword(firebaseAuth, cleanEmail, password)
      } catch (err) {
        setError(mapFirebaseError(err))
        throw err
      }
      return
    }

    const account = readLocalAccounts().find((item) => item.email === cleanEmail)
    if (!account) {
      setError('No existe una cuenta local con ese correo. Regístrate primero.')
      throw new Error('local/account-not-found')
    }
    if (account.passwordHash !== hashPassword(password)) {
      setError('Correo o contraseña incorrectos.')
      throw new Error('local/wrong-password')
    }
    const nextUser: AppUser = {
      uid: account.uid,
      email: account.email,
      displayName: account.displayName,
      photoURL: null,
      local: true,
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextUser))
    setUser(nextUser)
  }, [])

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    setError(null)
    const cleanEmail = email.trim().toLowerCase()
    const cleanName = name.trim()

    if (!cleanName) {
      setError('Escribe tu nombre de artista.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('El correo no tiene un formato válido.')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (usingFirebase && firebaseAuth) {
      try {
        const credential = await createUserWithEmailAndPassword(firebaseAuth, cleanEmail, password)
        if (credential.user) await updateProfile(credential.user, { displayName: cleanName })
        setUser({
          uid: credential.user.uid,
          email: credential.user.email ?? cleanEmail,
          displayName: cleanName,
          photoURL: credential.user.photoURL,
          local: false,
        })
      } catch (err) {
        setError(mapFirebaseError(err))
        throw err
      }
      return
    }

    const accounts = readLocalAccounts()
    if (accounts.some((item) => item.email === cleanEmail)) {
      setError('Ya existe una cuenta local con ese correo.')
      throw new Error('local/email-in-use')
    }
    const account: LocalAccount = {
      uid: `local-${hashPassword(cleanEmail)}`,
      email: cleanEmail,
      displayName: cleanName,
      passwordHash: hashPassword(password),
    }
    writeLocalAccounts([...accounts, account])
    const nextUser: AppUser = {
      uid: account.uid,
      email: account.email,
      displayName: account.displayName,
      photoURL: null,
      local: true,
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextUser))
    setUser(nextUser)
  }, [])

  const signInWithGoogle = useCallback(async () => {
    setError(null)
    if (!usingFirebase || !firebaseAuth) {
      setError('Google requiere configurar Firebase. Mientras tanto, usa el acceso local.')
      throw new Error('local/google-unavailable')
    }
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    try {
      await signInWithPopup(firebaseAuth, provider)
    } catch (err) {
      setError(mapFirebaseError(err))
      throw err
    }
  }, [])

  const signOutUser = useCallback(async () => {
    if (usingFirebase && firebaseAuth) {
      await signOut(firebaseAuth)
      return
    }
    localStorage.removeItem(SESSION_KEY)
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      mode: usingFirebase ? 'firebase' : 'local',
      error,
      clearError: () => setError(null),
      signIn,
      signUp,
      signInWithGoogle,
      signOutUser,
    }),
    [user, loading, error, signIn, signUp, signInWithGoogle, signOutUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}

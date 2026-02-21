import { createContext, useContext, useState, useEffect } from 'react'
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase'

const AuthContext = createContext(null)

// Human-readable messages for common Firebase auth errors
function authErrorMessage(code) {
  const messages = {
    'auth/popup-closed-by-user': 'Sign-in was cancelled.',
    'auth/popup-blocked': 'Popup was blocked. Allow popups for this site and try again.',
    'auth/unauthorized-domain': 'This domain is not allowed. Add it in Firebase Console → Authentication → Authorized domains.',
    'auth/cancelled-popup-request': 'Another sign-in was started. Please try again.',
    'auth/network-request-failed': 'Network error. Check your connection and try again.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/email-already-in-use': 'This email is already in use. Sign in instead.',
    'auth/weak-password': 'Please use a password of at least 6 characters.',
  }
  return messages[code] || `Sign-in failed: ${code || 'unknown'}.`
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(!!auth)
  const [authError, setAuthError] = useState(null)

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
      setAuthError(null)
    })
    return () => unsub()
  }, [])

  const signInWithGoogle = async () => {
    if (!auth) {
      setAuthError('Firebase is not configured. Add VITE_FIREBASE_* to .env')
      return
    }
    setAuthError(null)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      console.error('Google sign-in error:', err?.code, err?.message, err)
      const message = authErrorMessage(err?.code) || err?.message || 'Sign-in failed. Try again or check Firebase Authorized domains.'
      setAuthError(message)
      setLoading(false)
    }
  }

  const signInWithEmail = async (email, password) => {
    if (!auth) {
      setAuthError('Firebase is not configured. Add VITE_FIREBASE_* to .env')
      return
    }
    setAuthError(null)
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err) {
      const message = authErrorMessage(err?.code) || err?.message || 'Sign-in failed.'
      setAuthError(message)
    }
  }

  const signUpWithEmail = async (email, password, displayName = '') => {
    if (!auth) {
      setAuthError('Firebase is not configured. Add VITE_FIREBASE_* to .env')
      return
    }
    setAuthError(null)
    try {
      const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password)
      if (displayName.trim()) {
        await updateProfile(newUser, { displayName: displayName.trim() })
      }
    } catch (err) {
      const message = authErrorMessage(err?.code) || err?.message || 'Sign-up failed.'
      setAuthError(message)
    }
  }

  const signOut = async () => {
    if (auth) await firebaseSignOut(auth)
  }

  const clearAuthError = () => setAuthError(null)

  return (
    <AuthContext.Provider value={{ user, loading, authError, clearAuthError, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

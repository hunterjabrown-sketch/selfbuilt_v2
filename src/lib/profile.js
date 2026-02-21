import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './firebase'

const COLLECTION = 'profiles'

/** Get profile for a user. Doc id = uid. */
export async function getProfile(uid) {
  if (!db || !uid) return null
  const ref = doc(db, COLLECTION, uid)
  const snap = await getDoc(ref)
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

/** Create or update profile. Merges with existing. */
export async function saveProfile(uid, data) {
  if (!db || !uid) throw new Error('Firebase or user not configured')
  const ref = doc(db, COLLECTION, uid)
  await setDoc(ref, { ...data, updatedAt: new Date().toISOString() }, { merge: true })
}

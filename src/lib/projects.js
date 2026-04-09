import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'

const COLLECTION = 'projects'

const MAX_TITLE_LENGTH = 48

/** Turn a raw project idea into a neat display title (e.g. for lists). */
export function projectDisplayTitle(idea) {
  if (!idea || typeof idea !== 'string') return 'Untitled project'
  const trimmed = idea.trim().replace(/\s+/g, ' ')
  if (!trimmed) return 'Untitled project'
  const firstSentence = trimmed.split(/[.!?]/)[0].trim() || trimmed
  const text = firstSentence.length > MAX_TITLE_LENGTH
    ? firstSentence.slice(0, MAX_TITLE_LENGTH).trim() + '…'
    : firstSentence
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** Save a project for the given user. Storage is per-user; each account only sees their own. */
export async function saveProject(uid, projectIdea, guide) {
  if (!db) throw new Error('Firebase is not configured')
  const ref = await addDoc(collection(db, COLLECTION), {
    userId: uid,
    projectIdea,
    guide,
    ...(guide?.costEstimate ? { costEstimate: guide.costEstimate } : {}),
    createdAt: serverTimestamp(),
  })
  return ref.id
}

/** Get all saved projects for this user only. Other accounts cannot see them. */
export async function getProjects(uid) {
  if (!db) return []
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', uid),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate?.() }))
}

export async function deleteProject(projectId) {
  if (!db) return
  await deleteDoc(doc(db, COLLECTION, projectId))
}

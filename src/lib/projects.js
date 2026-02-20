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

export async function saveProject(uid, projectIdea, guide) {
  if (!db) throw new Error('Firebase is not configured')
  const ref = await addDoc(collection(db, COLLECTION), {
    userId: uid,
    projectIdea,
    guide,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

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

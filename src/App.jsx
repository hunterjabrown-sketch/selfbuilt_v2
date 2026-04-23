import { useState, useEffect, useRef, useCallback } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { getProfile } from './lib/profile'
import { saveProject } from './lib/projects'
import Landing from './components/Landing'
import TermsGate from './components/TermsGate'
import AppShellNav from './components/AppShellNav'
import SavedProjectsPage from './components/SavedProjectsPage'
import ProfileModal from './components/ProfileModal'

/** Bump when terms change; users below this must accept again. */
const REQUIRED_TERMS_VERSION = '2'

const IFRAME_SRC = '/selfbuilt-workshop.html?shell=1'

function postNavToFrame(win, view) {
  if (!win) return
  try {
    win.postMessage(
      { type: 'selfbuilt-nav', view },
      window.location.origin,
    )
  } catch (_) {}
}

/** Share signed-in user's profile with the workshop iframe so generated guides
 *  use their stated experience level (affects showVideo per step + Opus tone). */
function postProfileToFrame(win, { experienceLevel }) {
  if (!win) return
  try {
    win.postMessage(
      { type: 'selfbuilt-profile', experienceLevel: experienceLevel || '' },
      window.location.origin,
    )
  } catch (_) {}
}

function AppContent() {
  const { user, authError, clearAuthError } = useAuth()
  const [profileVersion, setProfileVersion] = useState(0)
  /** null = loading profile; true = terms accepted; false = must show Terms gate */
  const [termsAccepted, setTermsAccepted] = useState(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [profilePostTermsIntro, setProfilePostTermsIntro] = useState(false)
  const [shellView, setShellView] = useState('workshop')
  const [experienceLevel, setExperienceLevel] = useState('')
  const iframeRef = useRef(null)

  const syncFrameView = useCallback((view) => {
    if (view !== 'workshop' && view !== 'guide') return
    const w = iframeRef.current?.contentWindow
    postNavToFrame(w, view)
  }, [])

  const syncFrameProfile = useCallback(() => {
    const w = iframeRef.current?.contentWindow
    postProfileToFrame(w, { experienceLevel })
  }, [experienceLevel])

  useEffect(() => {
    if (shellView === 'workshop' || shellView === 'guide') {
      syncFrameView(shellView)
    }
  }, [shellView, syncFrameView])

  // Push profile updates into the iframe whenever experienceLevel changes.
  useEffect(() => {
    syncFrameProfile()
  }, [syncFrameProfile])

  // Listen for save requests from the workshop iframe and persist them to Firestore
  // under the signed-in user. Bumps profileVersion so SavedProjectsPage re-fetches.
  useEffect(() => {
    if (!user) return
    const onMessage = async (event) => {
      const data = event?.data
      if (!data || data.type !== 'selfbuilt-save') return
      try {
        const { projectIdea, guide, design, thumbnailDataUrl } = data.payload || {}
        if (!projectIdea || !guide) return
        await saveProject(user.uid, projectIdea, guide, { design, thumbnailDataUrl })
        setProfileVersion((v) => v + 1)
      } catch (err) {
        console.error('[selfbuilt-save] failed to persist project:', err?.message || err)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [user])

  useEffect(() => {
    if (!user) {
      setTermsAccepted(null)
      setExperienceLevel('')
      return
    }
    setTermsAccepted(null)
    getProfile(user.uid)
      .then((profile) => {
        const acceptedLatestTerms =
          !!profile?.termsAcceptedAt && String(profile?.termsVersion || '') === REQUIRED_TERMS_VERSION
        setTermsAccepted(acceptedLatestTerms)
        setExperienceLevel(profile?.experienceLevel || '')
      })
      .catch(() => {
        setTermsAccepted(false)
        setExperienceLevel('')
      })
  }, [user, profileVersion])

  if (!user) {
    return (
      <>
        {authError && (
          <div className="fixed top-4 left-4 right-4 z-[100] mx-auto max-w-md rounded-lg border border-amber-300 bg-amber-100 px-4 py-3 text-amber-900 shadow-lg flex items-center justify-between gap-4">
            <p className="text-sm font-medium">{authError}</p>
            <button type="button" onClick={clearAuthError} className="shrink-0 rounded px-2 py-1 text-sm font-medium hover:bg-amber-200">Dismiss</button>
          </div>
        )}
        <Landing />
      </>
    )
  }

  const showTermsGate = termsAccepted === false

  return (
    <div className="relative h-screen w-screen flex flex-col overflow-hidden bg-surface font-body text-on-surface">
      {authError && (
        <div className="absolute inset-x-0 top-0 z-40 border-b border-amber-300 bg-amber-100 px-4 py-2 text-amber-900">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
            <p className="text-sm font-medium">Sign-in issue: {authError}</p>
            <button
              type="button"
              onClick={clearAuthError}
              className="shrink-0 rounded px-2 py-1 text-xs font-medium hover:bg-amber-200"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <AppShellNav
        value={shellView}
        onChange={setShellView}
        rightSlot={
          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            aria-label="Profile"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-outline-variant/30 bg-surface-container-lowest text-on-surface-variant shadow-sm hover:border-secondary/40 hover:bg-surface-container-high hover:text-on-surface"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </button>
        }
      />

      {/*
        Both panes are mounted at all times. We toggle visibility via CSS instead of
        conditional rendering so switching to Saved Projects and back never unmounts
        (and reloads) the iframe — preserving the workshop session, 3D viewport, and
        any in-progress design across tab switches.
      */}
      <div className="min-h-0 flex-1 overflow-hidden pt-16">
        <div
          className="h-full min-h-0 overflow-y-auto"
          style={{ display: shellView === 'saved' ? 'block' : 'none' }}
        >
          <SavedProjectsPage
            refreshTrigger={profileVersion}
            experienceLevel={experienceLevel}
          />
        </div>
        <iframe
          ref={iframeRef}
          title="SelfBuilt design workshop"
          src={IFRAME_SRC}
          onLoad={() => {
            syncFrameView(shellView)
            syncFrameProfile()
          }}
          className="block h-full w-full border-0 bg-surface"
          style={{ display: shellView === 'saved' ? 'none' : 'block' }}
        />
      </div>

      <ProfileModal
        isOpen={profileOpen}
        onClose={() => {
          setProfileOpen(false)
          setProfilePostTermsIntro(false)
        }}
        onSaved={() => setProfileVersion((v) => v + 1)}
        postTermsIntro={profilePostTermsIntro}
      />

      {showTermsGate && (
        <TermsGate
          user={user}
          onAccepted={() => {
            setTermsAccepted(true)
            setProfileVersion((v) => v + 1)
            setProfilePostTermsIntro(true)
            setProfileOpen(true)
          }}
        />
      )}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Logo from './Logo'
import ProfileModal from './ProfileModal'

export default function Header({
  onOpenSaved,
  currentView,
  hasSidebar,
  sidebarOpen,
  onToggleSidebar,
  onProfileSaved,
  profileOpenTrigger = 0,
  profilePostTermsIntro = false,
  onProfileIntroDismiss,
}) {
  const { user, loading, signInWithGoogle } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)
  const lastProfileTrigger = useRef(0)

  useEffect(() => {
    if (profileOpenTrigger > lastProfileTrigger.current) {
      lastProfileTrigger.current = profileOpenTrigger
      setProfileOpen(true)
    }
  }, [profileOpenTrigger])

  return (
    <header className="flex min-h-16 shrink-0 items-center border-b border-outline-variant/20 bg-surface py-2 sm:py-0">
      <div className="flex w-full items-center justify-between gap-3 px-4 sm:px-8">
        <div className="flex min-w-0 items-center gap-3">
          {user && onToggleSidebar && !sidebarOpen && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              aria-label="Open sidebar"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          <div className="flex min-w-0 flex-col gap-0 leading-tight sm:flex-row sm:items-baseline sm:gap-2.5 sm:leading-none">
            <Logo className="text-xl sm:text-2xl" />
            <p className="text-[11px] font-medium text-on-surface-variant sm:text-xs md:text-sm">AI-powered DIY build planner</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {user && !hasSidebar && (
            <button
              type="button"
              onClick={onOpenSaved}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                currentView === 'saved' ? 'bg-secondary text-on-secondary shadow-md shadow-secondary/25' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              Saved
            </button>
          )}
          {loading ? (
            <span className="h-9 w-20 animate-pulse rounded-xl bg-surface-container-high" />
          ) : user ? (
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-outline-variant/30 bg-surface-container-lowest text-on-surface-variant hover:border-secondary/40 hover:bg-surface-container-high hover:text-on-surface"
              aria-label="Profile"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => signInWithGoogle()}
              className="flex items-center gap-2 rounded-xl border border-outline-variant/25 bg-surface-container-lowest px-4 py-2 text-sm font-medium text-on-surface shadow-sm hover:bg-surface-container-high"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in with Google
            </button>
          )}
        </div>
      </div>
      <ProfileModal
        isOpen={profileOpen}
        onClose={() => {
          setProfileOpen(false)
          onProfileIntroDismiss?.()
        }}
        onSaved={onProfileSaved}
        postTermsIntro={profilePostTermsIntro}
      />
    </header>
  )
}

import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function SignInModal({ isOpen, onClose }) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, loading, authError, clearAuthError } = useAuth()
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [matchError, setMatchError] = useState('')

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setDisplayName('')
    setMatchError('')
    clearAuthError()
  }

  useEffect(() => {
    if (isOpen) {
      resetForm()
      setMode('signin')
    }
  }, [isOpen])

  const handleClose = () => {
    onClose()
    resetForm()
  }

  const handleGoogle = () => {
    clearAuthError()
    signInWithGoogle()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setMatchError('')
    if (!email.trim() || !password) return
    if (mode === 'signup') {
      if (!displayName.trim()) return
      if (password !== confirmPassword) {
        setMatchError('Passwords do not match.')
        return
      }
    }
    clearAuthError()
    if (mode === 'signup') {
      signUpWithEmail(email.trim(), password, displayName.trim())
    } else {
      signInWithEmail(email.trim(), password)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50"
        aria-hidden
        onClick={handleClose}
      />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onKeyDown={(e) => e.key === 'Escape' && handleClose()}
      >
        <div
          className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white shadow-xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="signin-title"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 id="signin-title" className="text-lg font-semibold text-neutral-900">
                Sign in
              </h2>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white py-3 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 disabled:opacity-60"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 border-t border-neutral-200" />
              <span className="text-xs text-neutral-500">or</span>
              <div className="flex-1 border-t border-neutral-200" />
            </div>

            <div className="flex rounded-lg border border-neutral-200 bg-neutral-50/50 p-0.5 mb-4">
              <button
                type="button"
                onClick={() => { setMode('signin'); setMatchError(''); clearAuthError() }}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition ${mode === 'signin' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600 hover:text-neutral-900'}`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); setMatchError(''); clearAuthError() }}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition ${mode === 'signup' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600 hover:text-neutral-900'}`}
              >
                Create account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {(authError || matchError) && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{authError || matchError}</p>
              )}
              {mode === 'signup' && (
                <div>
                  <label htmlFor="signin-name" className="block text-sm font-medium text-neutral-700 mb-1">
                    Name
                  </label>
                  <input
                    id="signin-name"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="How we’ll greet you"
                    required
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400"
                  />
                </div>
              )}
              <div>
                <label htmlFor="signin-email" className="block text-sm font-medium text-neutral-700 mb-1">
                  Email
                </label>
                <input
                  id="signin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400"
                />
              </div>
              <div>
                <label htmlFor="signin-password" className="block text-sm font-medium text-neutral-700 mb-1">
                  Password
                </label>
                <input
                  id="signin-password"
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setMatchError('') }}
                  placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
                  required
                  minLength={mode === 'signup' ? 6 : undefined}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400"
                />
              </div>
              {mode === 'signup' && (
                <div>
                  <label htmlFor="signin-confirm-password" className="block text-sm font-medium text-neutral-700 mb-1">
                    Confirm password
                  </label>
                  <input
                    id="signin-confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setMatchError('') }}
                    placeholder="Re-enter password"
                    required
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400"
                  />
                </div>
              )}
              <button
                type="submit"
                disabled={loading || (mode === 'signup' && (!displayName.trim() || !confirmPassword || password !== confirmPassword))}
                className="w-full rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"
              >
                {loading ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
              </button>
            </form>

            <p className="mt-4 text-center text-xs text-neutral-500">
              By signing in you can save projects and use your profile. We store your info securely.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

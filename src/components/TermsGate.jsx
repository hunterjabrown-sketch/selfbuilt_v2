import { useState } from 'react'
import { saveProfile } from '../lib/profile'

const TERMS_URL = '/terms.html'
const TERMS_VERSION = '1'

export default function TermsGate({ user, onAccepted }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleAccept = async () => {
    if (!user?.uid) return
    setSaving(true)
    setError(null)
    try {
      await saveProfile(user.uid, {
        termsAcceptedAt: new Date().toISOString(),
        termsVersion: TERMS_VERSION,
      })
      onAccepted()
    } catch (err) {
      setError(err?.message || 'Could not save. Check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-gate-title"
        className="sb-card ghost-shadow max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-outline-variant/20 bg-surface p-6 shadow-xl sm:p-8"
      >
        <h2 id="terms-gate-title" className="font-headline text-xl font-bold text-primary sm:text-2xl">
          Terms of Service
        </h2>
        <p className="mt-3 text-sm text-on-surface-variant">
          <a
            href={TERMS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-secondary underline underline-offset-2 hover:text-primary"
          >
            Read full Terms of Service
          </a>{' '}
          <span className="text-on-surface-variant">(opens in a new tab)</span>
        </p>

        {error && <p className="mt-4 text-sm text-error">{error}</p>}

        <button
          type="button"
          disabled={saving}
          onClick={handleAccept}
          className="sb-btn-primary mt-6 w-full disabled:pointer-events-none disabled:opacity-45"
        >
          {saving ? 'Saving…' : 'I acknowledge and continue'}
        </button>
      </div>
    </div>
  )
}

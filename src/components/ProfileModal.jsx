import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getProfile, saveProfile } from '../lib/profile'

const EXPERIENCE_OPTIONS = [
  '',
  'First time / beginner',
  'Some DIY experience',
  'Comfortable with tools',
  'Experienced',
]

const defaultFields = { displayName: '', phone: '', experienceLevel: '' }

export default function ProfileModal({ isOpen, onClose, onSaved, postTermsIntro = false }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState(defaultFields)

  useEffect(() => {
    if (!isOpen || !user) return
    setError(null)
    setForm(defaultFields)
    setLoading(true)
    getProfile(user.uid)
      .then((profile) => {
        if (profile) {
          setForm({
            displayName: profile.displayName ?? user.displayName ?? '',
            phone: profile.phone ?? '',
            experienceLevel: profile.experienceLevel ?? '',
          })
        } else {
          setForm({
            displayName: user.displayName ?? '',
            phone: '',
            experienceLevel: '',
          })
        }
      })
      .catch((err) => setError(err?.message || 'Couldn’t load profile'))
      .finally(() => setLoading(false))
  }, [isOpen, user])

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setError(null)
    try {
      await saveProfile(user.uid, {
        displayName: form.displayName.trim() || null,
        phone: form.phone.trim() || null,
        experienceLevel: form.experienceLevel.trim() || null,
      })
      onSaved?.()
      onClose()
    } catch (err) {
      setError(err?.message || 'Couldn’t save')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-[200] bg-primary/40 backdrop-blur-[2px]" aria-hidden onClick={onClose} />
      <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-md overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-lowest shadow-xl ghost-shadow"
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-title"
        >
          <div className="border-b border-outline-variant/15 px-5 py-4">
            <div className="flex items-center justify-between">
              <h2 id="profile-title" className="font-headline text-lg font-bold text-primary">
                Profile
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-2 text-on-surface-variant hover:bg-surface-container-high"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {postTermsIntro && (
              <p className="mt-3 text-sm leading-snug text-on-surface-variant">
                Add your name and experience level so your guides match how you like to build.
              </p>
            )}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4 p-5">
            {error && <p className="rounded-xl bg-error-container/50 px-3 py-2 text-sm text-error">{error}</p>}
            <div>
              <label htmlFor="profile-email" className="block text-sm font-medium text-on-surface-variant">
                Email
              </label>
              <input
                id="profile-email"
                type="email"
                value={user?.email ?? ''}
                readOnly
                disabled
                className="sb-input mt-1 cursor-not-allowed opacity-70"
              />
              <p className="mt-1 text-xs text-on-surface-variant/80">From your sign-in account; can’t be changed here.</p>
            </div>
            <div>
              <label htmlFor="profile-displayName" className="block text-sm font-medium text-on-surface-variant">
                Display name
              </label>
              <input
                id="profile-displayName"
                type="text"
                value={form.displayName}
                onChange={handleChange('displayName')}
                placeholder="Your name"
                className="sb-input mt-1 text-sm"
              />
            </div>
            <div>
              <label htmlFor="profile-phone" className="block text-sm font-medium text-on-surface-variant">
                Phone
              </label>
              <input
                id="profile-phone"
                type="tel"
                value={form.phone}
                onChange={handleChange('phone')}
                placeholder="Optional"
                className="sb-input mt-1 text-sm"
              />
            </div>
            <div>
              <label htmlFor="profile-experienceLevel" className="block text-sm font-medium text-on-surface-variant">
                Experience level
              </label>
              <select
                id="profile-experienceLevel"
                value={form.experienceLevel}
                onChange={handleChange('experienceLevel')}
                className="sb-input mt-1 text-sm"
              >
                {EXPERIENCE_OPTIONS.map((opt) => (
                  <option key={opt || 'unset'} value={opt}>
                    {opt || 'Select one (optional)'}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-on-surface-variant/80">Used to tailor your builder guides.</p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container-high/80"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || saving}
                className="sb-btn-primary flex-1 py-2.5 text-sm disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-surface/80 backdrop-blur-sm">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-outline-variant border-t-secondary" />
            </div>
          )}
        </div>
      </div>
    </>
  )
}

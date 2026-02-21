import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getProfile, saveProfile } from '../lib/profile'

const defaultFields = { displayName: '', phone: '', photoURL: '' }

export default function ProfileModal({ isOpen, onClose, onSaved }) {
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
            photoURL: profile.photoURL ?? user.photoURL ?? '',
          })
        } else {
          setForm({
            displayName: user.displayName ?? '',
            phone: '',
            photoURL: user.photoURL ?? '',
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
        photoURL: form.photoURL.trim() || null,
      })
      onSaved?.()
      onClose()
    } catch (err) {
      setError(err?.message || 'Couldn’t save profile')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40"
        aria-hidden
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-md rounded-2xl border border-neutral-200 bg-white shadow-xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-title"
        >
          <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
            <h2 id="profile-title" className="text-lg font-semibold text-neutral-900">
              Profile
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
            )}
            <div>
              <label htmlFor="profile-email" className="block text-sm font-medium text-neutral-700">
                Email
              </label>
              <input
                id="profile-email"
                type="email"
                value={user?.email ?? ''}
                readOnly
                disabled
                className="mt-1 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-500"
              />
              <p className="mt-1 text-xs text-neutral-400">From your sign-in account; can’t be changed here.</p>
            </div>
            <div>
              <label htmlFor="profile-displayName" className="block text-sm font-medium text-neutral-700">
                Display name
              </label>
              <input
                id="profile-displayName"
                type="text"
                value={form.displayName}
                onChange={handleChange('displayName')}
                placeholder="Your name"
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400"
              />
            </div>
            <div>
              <label htmlFor="profile-phone" className="block text-sm font-medium text-neutral-700">
                Phone
              </label>
              <input
                id="profile-phone"
                type="tel"
                value={form.phone}
                onChange={handleChange('phone')}
                placeholder="Optional"
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400"
              />
            </div>
            <div>
              <label htmlFor="profile-photoURL" className="block text-sm font-medium text-neutral-700">
                Photo URL
              </label>
              <input
                id="profile-photoURL"
                type="url"
                value={form.photoURL}
                onChange={handleChange('photoURL')}
                placeholder="https://…"
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || saving}
                className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/80">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-600" />
            </div>
          )}
        </div>
      </div>
    </>
  )
}

import { useEffect, useState } from 'react'
import {
  applyDimensionReplacements,
  buildMeasurementRows,
  ensureGuideClientMeta,
} from '../lib/guideMeasurements'

export default function MeasurementsModal({ isOpen, guide, onClose, onApply }) {
  const [notes, setNotes] = useState('')
  const [rows, setRows] = useState([])

  useEffect(() => {
    if (!isOpen || !guide) return
    const g = ensureGuideClientMeta(guide)
    setNotes(g._client.dimensionsInput || '')
    const entries = buildMeasurementRows(guide)
    setRows(entries.map((e) => ({ from: e.phrase, to: e.phrase, description: e.description })))
  }, [isOpen, guide])

  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  const handleRowChange = (index, value) => {
    setRows((prev) => {
      const next = [...prev]
      if (next[index]) next[index] = { ...next[index], to: value }
      return next
    })
  }

  const handleApply = () => {
    if (!guide) return
    const pairs = rows.map((r) => ({ from: r.from, to: r.to }))
    let next = applyDimensionReplacements(ensureGuideClientMeta(guide), pairs)
    next = {
      ...next,
      _client: {
        ...(next._client || {}),
        dimensionsInput: notes.trim(),
      },
    }
    onApply(next)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/45 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="measurements-modal-title"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="sb-card flex max-h-[min(90vh,720px)] w-full max-w-lg flex-col rounded-2xl border border-outline-variant/20 bg-surface-container-lowest shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="border-b border-outline-variant/15 px-5 py-4 sm:px-6">
          <h2 id="measurements-modal-title" className="font-headline text-lg font-bold text-primary">
            Project measurements
          </h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Edit values below and apply. The guide updates everywhere, with no new generation.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          <label className="block font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Your dimension notes
          </label>
          <p className="mt-1 text-xs text-on-surface-variant/85">
            What you entered when building this guide. Edit if your overall sizes changed.
          </p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="sb-input mt-2 resize-y text-sm"
            placeholder="e.g. shelf 48&quot; wide × 12&quot; deep × 1½&quot; thick"
          />

          <h3 className="mt-6 font-label text-xs font-bold uppercase tracking-wider text-secondary">
            Measurements found in this guide
          </h3>
          <p className="mt-1 text-xs text-on-surface-variant/85">
            Sizes here focus on your project pieces and cuts. Fastener sizes (screws, nails, etc.) and tool specs are left out. Changes apply everywhere in the guide.
          </p>

          {rows.length === 0 ? (
            <p className="mt-3 rounded-xl border border-outline-variant/25 bg-surface-container-low/80 px-3 py-2 text-sm text-on-surface-variant">
              No specific measurements were detected in the guide text. You can still save your notes above.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {rows.map((row, i) => (
                <li key={`${row.from}-${i}`} className="rounded-xl border border-outline-variant/20 bg-surface-container-low/60 p-3">
                  {row.description && (
                    <p className="mb-2 text-xs leading-snug text-on-surface-variant/90">{row.description}</p>
                  )}
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant/80">Original in guide</p>
                  <p className="mt-0.5 font-mono text-xs text-on-surface">{row.from}</p>
                  <label className="mt-2 block text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant/80">
                    Replace with
                  </label>
                  <input
                    type="text"
                    value={row.to}
                    onChange={(e) => handleRowChange(i, e.target.value)}
                    className="sb-input mt-1 font-mono text-sm"
                    autoComplete="off"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-outline-variant/15 px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-outline-variant/40 bg-surface-container px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-high"
          >
            Cancel
          </button>
          <button type="button" onClick={handleApply} className="sb-btn-primary px-4 py-2 text-sm">
            Apply changes
          </button>
        </div>
      </div>
    </div>
  )
}

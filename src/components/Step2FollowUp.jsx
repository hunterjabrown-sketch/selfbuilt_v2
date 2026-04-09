import { useRef, useState } from 'react'

const ACCEPT = 'image/*,.heic,.heif'
const MAX_SIZE_MB = 50
const MAX_FILES = 6

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function Step2FollowUp({
  projectIdea,
  initialAnswers,
  initialMedia,
  onSubmit,
  error,
}) {
  const [designDescription, setDesignDescription] = useState(initialAnswers.designDescription || '')
  const [dimensions, setDimensions] = useState(initialAnswers.dimensions || '')
  const [materialsAccess, setMaterialsAccess] = useState(initialAnswers.materialsAccess || '')
  const [files, setFiles] = useState(initialMedia)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef(null)

  const handleFileChange = async (e) => {
    const selected = Array.from(e.target.files || [])
    setUploadError('')
    if (files.length + selected.length > MAX_FILES) {
      setUploadError(`Max ${MAX_FILES} files. You have ${files.length} and tried to add ${selected.length}.`)
      return
    }
    const toAdd = []
    for (const file of selected) {
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setUploadError(`"${file.name}" is over ${MAX_SIZE_MB}MB. Skipped.`)
        continue
      }
      if (!file.type.startsWith('image/')) continue
      try {
        const data = await fileToBase64(file)
        toAdd.push({ file, type: file.type, data, name: file.name })
      } catch {
        setUploadError('Failed to read one or more files.')
      }
    }
    setFiles((prev) => [...prev, ...toAdd])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeFile = (index) => setFiles((prev) => prev.filter((_, i) => i !== index))

  const handleSubmit = () => {
    onSubmit({ designDescription, dimensions, materialsAccess }, files)
  }

  const labelCls = 'block font-label text-sm font-bold uppercase tracking-wider text-on-surface-variant'
  const hintCls = 'mt-1 text-sm text-on-surface-variant/90'

  return (
    <section className="space-y-10">
      <div className="sb-card ghost-shadow p-6">
        <p className="font-label text-xs font-bold uppercase tracking-widest text-secondary">Design input</p>
        <p className="mt-2 font-headline text-lg font-semibold text-primary">{projectIdea}</p>
        <p className="mt-2 text-sm text-on-surface-variant/90">
          This is your core design direction. Keep it focused on what you want to build, style, and intended use.
        </p>
      </div>

      <div className="space-y-8">
        <div>
          <label className={labelCls}>Photos of the space (optional)</label>
          <p className={hintCls}>
            Upload photos so we can see what you&apos;re working with. Helps with layout and measurements.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT}
            multiple
            onChange={handleFileChange}
            className="mt-3 block w-full text-sm text-on-surface-variant file:mr-3 file:rounded-xl file:border-0 file:bg-secondary/15 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-secondary hover:file:bg-secondary/25"
          />
          {uploadError && <p className="mt-2 text-sm text-error">{uploadError}</p>}
          {files.length > 0 && (
            <ul className="mt-3 space-y-2">
              {files.map((f, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-xl border border-outline-variant/20 bg-surface-container-high/80 px-3 py-2 text-sm text-on-surface"
                >
                  <span className="truncate">{f.name}</span>
                  <button type="button" onClick={() => removeFile(i)} className="ml-2 text-on-surface-variant hover:text-error">
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label className={labelCls}>Describe your design (optional)</label>
          <p className={hintCls}>
            Add style, features, and intended use so the guide matches what you actually want to build.
          </p>
          <textarea
            value={designDescription}
            onChange={(e) => setDesignDescription(e.target.value)}
            placeholder="e.g. Minimal modern entry table with open lower shelf and rounded corners"
            rows={3}
            className="sb-input mt-3 resize-none overflow-y-auto"
          />
        </div>

        <div>
          <label className={labelCls}>Dimensions of design (optional)</label>
          <p className={hintCls}>
            Share exact dimensions when you can — or put sizes in Design above; we read every field together. Better measurements = better cut lists, material counts, and safer instructions.
          </p>
          <textarea
            value={dimensions}
            onChange={(e) => setDimensions(e.target.value)}
            placeholder='e.g. 48" wide, 24" deep'
            rows={3}
            className="sb-input mt-3 resize-none overflow-y-auto"
          />
        </div>

        <div>
          <label className={labelCls}>Materials you have access to (optional)</label>
          <p className={hintCls}>What you already have or where you can buy (e.g. Home Depot, scrap wood)</p>
          <textarea
            value={materialsAccess}
            onChange={(e) => setMaterialsAccess(e.target.value)}
            placeholder="e.g. 2x4s, plywood, basic hardware store"
            rows={3}
            className="sb-input mt-3 resize-none overflow-y-auto"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{error}</div>
        )}

        <button type="button" onClick={handleSubmit} className="sb-btn-primary w-full sm:w-auto sm:min-w-[220px]">
          Generate my builder&apos;s guide
        </button>
      </div>
    </section>
  )
}

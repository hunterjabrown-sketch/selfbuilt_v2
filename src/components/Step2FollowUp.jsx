import { useState, useRef } from 'react'

const ACCEPT = 'image/*,.heic,.heif'
const MAX_SIZE_MB = 10
const MAX_FILES = 6

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function Step2FollowUp({ projectIdea, initialAnswers, initialMedia, onSubmit, error }) {
  const [dimensions, setDimensions] = useState(initialAnswers.dimensions || '')
  const [materialsAccess, setMaterialsAccess] = useState(initialAnswers.materialsAccess || '')
  const [experienceLevel, setExperienceLevel] = useState(initialAnswers.experienceLevel || '')
  const [files, setFiles] = useState(initialMedia)
  const [uploadError, setUploadError] = useState('')
  const inputRef = useRef(null)

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
    if (inputRef.current) inputRef.current.value = ''
  }

  const removeFile = (index) => setFiles((prev) => prev.filter((_, i) => i !== index))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(
      { dimensions, materialsAccess, experienceLevel },
      files
    )
  }

  return (
    <section className="space-y-10">
      <div>
        <p className="text-sm font-medium text-neutral-500">Your project</p>
        <p className="mt-1 text-lg font-semibold text-neutral-900">{projectIdea}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <label className="block text-sm font-semibold text-neutral-900">Dimensions of the space (optional)</label>
          <p className="mt-1 text-sm text-neutral-500">e.g. 4ft wide, 8ft ceiling, or exact measurements</p>
          <input
            type="text"
            value={dimensions}
            onChange={(e) => setDimensions(e.target.value)}
            placeholder="e.g. 48&quot; wide, 24&quot; deep"
            className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500/20"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-neutral-900">Materials you have access to (optional)</label>
          <p className="mt-1 text-sm text-neutral-500">What you already have or where you can buy (e.g. Home Depot, scrap wood)</p>
          <input
            type="text"
            value={materialsAccess}
            onChange={(e) => setMaterialsAccess(e.target.value)}
            placeholder="e.g. 2x4s, plywood, basic hardware store"
            className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500/20"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-neutral-900">Experience level (optional)</label>
          <select
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value)}
            className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500/20"
          >
            <option value="">Select one</option>
            <option value="First time / beginner">First time / beginner</option>
            <option value="Some DIY experience">Some DIY experience</option>
            <option value="Comfortable with tools">Comfortable with tools</option>
            <option value="Experienced">Experienced</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-neutral-900">Photos of the space (optional)</label>
          <p className="mt-1 text-sm text-neutral-500">Upload photos so the AI can see what you're working with. Helps with layout and measurements.</p>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            multiple
            onChange={handleFileChange}
            className="mt-2 block w-full text-sm text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-4 file:py-2 file:font-medium file:text-neutral-900"
          />
          {uploadError && <p className="mt-2 text-sm text-red-600">{uploadError}</p>}
          {files.length > 0 && (
            <ul className="mt-3 space-y-2">
              {files.map((f, i) => (
                <li key={i} className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 text-sm">
                  <span className="truncate text-neutral-700">{f.name}</span>
                  <button type="button" onClick={() => removeFile(i)} className="ml-2 text-neutral-500 hover:text-red-600">
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full rounded-lg bg-neutral-900 px-4 py-3 text-base font-semibold text-white transition hover:bg-neutral-800 sm:w-auto sm:min-w-[180px]"
        >
          Generate my builder's guide
        </button>
      </form>
    </section>
  )
}

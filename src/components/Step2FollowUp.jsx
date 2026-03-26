import { useEffect, useRef, useState } from 'react'

const ACCEPT = 'image/*,.heic,.heif'
const MAX_SIZE_MB = 50
const MAX_FILES = 6

function classifyQuestionTarget(text = '') {
  const t = String(text).toLowerCase()
  if (/\b(height|width|length|dimension|size|depth|clearance|measurement|measure)\b/.test(t)) return 'dimensions'
  if (/\b(material|wood|lumber|plywood|finish|hardware|budget)\b/.test(t)) return 'materials'
  if (/\b(experience|skill|beginner|advanced|tools comfort)\b/.test(t)) return 'experience'
  if (/\b(style|design|look|aesthetic|feature|layout)\b/.test(t)) return 'design'
  if (/\b(photo|image|picture|visual)\b/.test(t)) return 'photos'
  return 'general'
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function Step2FollowUp({ projectIdea, initialAnswers, initialMedia, onSubmit, error, clarification }) {
  const [designDescription, setDesignDescription] = useState(initialAnswers.designDescription || '')
  const [dimensions, setDimensions] = useState(initialAnswers.dimensions || '')
  const [materialsAccess, setMaterialsAccess] = useState(initialAnswers.materialsAccess || '')
  const [experienceLevel, setExperienceLevel] = useState(initialAnswers.experienceLevel || '')
  const [files, setFiles] = useState(initialMedia)
  const [uploadError, setUploadError] = useState('')
  const inputRef = useRef(null)
  const dimensionsRef = useRef(null)
  const designRef = useRef(null)
  const materialsRef = useRef(null)
  const experienceRef = useRef(null)
  const photosRef = useRef(null)

  const groupedQuestions = { general: [], design: [], dimensions: [], materials: [], experience: [], photos: [] }
  if (clarification?.questions?.length) {
    clarification.questions.forEach((q) => {
      groupedQuestions[classifyQuestionTarget(q)].push(q)
    })
  }
  const hasAnyTargetedQuestions =
    groupedQuestions.design.length > 0 ||
    groupedQuestions.dimensions.length > 0 ||
    groupedQuestions.materials.length > 0 ||
    groupedQuestions.experience.length > 0 ||
    groupedQuestions.photos.length > 0

  useEffect(() => {
    if (clarification) {
      const firstTargetRef =
        (groupedQuestions.design.length > 0 && designRef.current) ||
        (groupedQuestions.dimensions.length > 0 && dimensionsRef.current) ||
        (groupedQuestions.materials.length > 0 && materialsRef.current) ||
        (groupedQuestions.experience.length > 0 && experienceRef.current) ||
        (groupedQuestions.photos.length > 0 && photosRef.current) ||
        dimensionsRef.current
      firstTargetRef?.focus?.()
      firstTargetRef?.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
    }
  }, [clarification, groupedQuestions.design.length, groupedQuestions.dimensions.length, groupedQuestions.materials.length, groupedQuestions.experience.length, groupedQuestions.photos.length])

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

  const handleSubmit = () => {
    onSubmit({ designDescription, dimensions, materialsAccess, experienceLevel }, files)
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
        {clarification && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-4 text-amber-900">
            <p className="font-semibold">We'd love to build this - we need a little more detail first.</p>
            <p className="mt-2 text-sm">{clarification.message}</p>
            {!hasAnyTargetedQuestions && clarification.questions?.length > 0 && (
              <ul className="mt-3 list-inside list-disc space-y-1 text-sm">
                {clarification.questions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-sm font-medium">Answer the highlighted sections below, then click Generate again.</p>
          </div>
        )}

        <div>
          {groupedQuestions.design.length > 0 && (
            <div className="mb-3 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900">
              {groupedQuestions.design.map((q, i) => (
                <p key={i}>{q}</p>
              ))}
            </div>
          )}
          <label className={labelCls}>Describe your design (optional)</label>
          <p className={hintCls}>
            Add style, features, and intended use so the guide matches what you actually want to build.
          </p>
          <textarea
            ref={designRef}
            value={designDescription}
            onChange={(e) => setDesignDescription(e.target.value)}
            placeholder="e.g. Minimal modern entry table with open lower shelf and rounded corners"
            rows={3}
            className={`sb-input mt-3 resize-none overflow-y-auto ${groupedQuestions.design.length > 0 ? 'border-red-400 ring-2 ring-red-200' : ''}`}
          />
        </div>

        <div>
          {groupedQuestions.dimensions.length > 0 && (
            <div className="mb-3 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900">
              {groupedQuestions.dimensions.map((q, i) => (
                <p key={i}>{q}</p>
              ))}
            </div>
          )}
          <label className={groupedQuestions.dimensions.length > 0 ? `${labelCls} text-red-800` : labelCls}>Dimensions of design (optional)</label>
          <p className={hintCls}>
            Share exact dimensions when you can. Better measurements = better cut lists, material counts, and safer instructions.
          </p>
          <textarea
            ref={dimensionsRef}
            value={dimensions}
            onChange={(e) => setDimensions(e.target.value)}
            placeholder='e.g. 48" wide, 24" deep'
            rows={3}
            className={`sb-input mt-3 resize-none overflow-y-auto ${groupedQuestions.dimensions.length > 0 ? 'border-red-400 ring-2 ring-red-200' : ''}`}
          />
        </div>

        <div>
          {groupedQuestions.materials.length > 0 && (
            <div className="mb-3 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900">
              {groupedQuestions.materials.map((q, i) => (
                <p key={i}>{q}</p>
              ))}
            </div>
          )}
          <label className={labelCls}>Materials you have access to (optional)</label>
          <p className={hintCls}>What you already have or where you can buy (e.g. Home Depot, scrap wood)</p>
          <textarea
            ref={materialsRef}
            value={materialsAccess}
            onChange={(e) => setMaterialsAccess(e.target.value)}
            placeholder="e.g. 2x4s, plywood, basic hardware store"
            rows={3}
            className={`sb-input mt-3 resize-none overflow-y-auto ${groupedQuestions.materials.length > 0 ? 'border-red-400 ring-2 ring-red-200' : ''}`}
          />
        </div>

        <div>
          {groupedQuestions.experience.length > 0 && (
            <div className="mb-3 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900">
              {groupedQuestions.experience.map((q, i) => (
                <p key={i}>{q}</p>
              ))}
            </div>
          )}
          <label className={labelCls}>Experience level (optional)</label>
          <select
            ref={experienceRef}
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value)}
            className={`sb-input mt-3 ${groupedQuestions.experience.length > 0 ? 'border-red-400 ring-2 ring-red-200' : ''}`}
          >
            <option value="">Select one</option>
            <option value="First time / beginner">First time / beginner</option>
            <option value="Some DIY experience">Some DIY experience</option>
            <option value="Comfortable with tools">Comfortable with tools</option>
            <option value="Experienced">Experienced</option>
          </select>
        </div>

        <div>
          {groupedQuestions.photos.length > 0 && (
            <div className="mb-3 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900">
              {groupedQuestions.photos.map((q, i) => (
                <p key={i}>{q}</p>
              ))}
            </div>
          )}
          <label className={labelCls}>Photos of the space (optional)</label>
          <p className={hintCls}>
            Upload photos so the AI can see what you&apos;re working with. Helps with layout and measurements.
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            multiple
            onChange={handleFileChange}
            className={`mt-3 block w-full text-sm text-on-surface-variant file:mr-3 file:rounded-xl file:border-0 file:bg-secondary/15 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-secondary hover:file:bg-secondary/25 ${groupedQuestions.photos.length > 0 ? 'rounded-xl border border-red-400 ring-2 ring-red-200' : ''}`}
          />
          <div ref={photosRef} />
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

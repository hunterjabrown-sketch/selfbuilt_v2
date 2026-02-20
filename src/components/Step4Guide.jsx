export default function Step4Guide({ guide, onStartOver, projectIdea, onSave, isSaved }) {
  const summary = guide.summary || {}
  const materials = summary.materials || []
  const tools = summary.tools || []
  const steps = guide.steps || []

  return (
    <section className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-neutral-900">Your builder's guide</h2>
        <div className="flex flex-wrap items-center gap-2">
          {onSave && !isSaved && projectIdea && (
            <button
              type="button"
              onClick={() => onSave(projectIdea, guide)}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Save to my projects
            </button>
          )}
          {isSaved && (
            <span className="rounded-lg bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-600">
              Saved
            </span>
          )}
          <button
            type="button"
            onClick={onStartOver}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Start a new project
          </button>
        </div>
      </div>

      {/* Summary box — materials & tools */}
      <div className="rounded-xl border-2 border-neutral-200 bg-neutral-50 p-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500">What you need</h3>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <div>
            <h4 className="text-sm font-semibold text-neutral-700">Materials</h4>
            <ul className="mt-2 list-inside list-disc space-y-1 text-neutral-800">
              {materials.length ? materials.map((m, i) => <li key={i}>{m}</li>) : <li className="list-none text-neutral-500">—</li>}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-neutral-700">Tools</h4>
            <ul className="mt-2 list-inside list-disc space-y-1 text-neutral-800">
              {tools.length ? tools.map((t, i) => <li key={i}>{t}</li>) : <li className="list-none text-neutral-500">—</li>}
            </ul>
          </div>
        </div>
      </div>

      {/* Numbered steps */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500">Step-by-step instructions</h3>
        <ol className="mt-6 list-none space-y-8 pl-0">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white">
                {s.number ?? i + 1}
              </span>
              <div className="min-w-0 flex-1">
                {s.title && <h4 className="text-lg font-semibold text-neutral-900">{s.title}</h4>}
                <p className="mt-2 whitespace-pre-wrap text-neutral-700 leading-relaxed">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <button
        type="button"
        onClick={onStartOver}
        className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
      >
        Start a new project
      </button>
    </section>
  )
}

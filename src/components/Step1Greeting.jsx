import { useState } from 'react'

export default function Step1Greeting({ firstName, onSubmit }) {
  const [input, setInput] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (trimmed) onSubmit(trimmed)
  }

  const title = firstName
    ? `What would you like to build today, ${firstName}?`
    : 'What would you like to build today?'

  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-neutral-900 sm:text-2xl">
          {title}
        </h2>
        <p className="mt-2 text-neutral-600">
          Describe your project in a sentence or two—a shelf, a desk, a small repair, or something bigger.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. A floating shelf next to my TV"
          className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500/20"
          autoFocus
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="w-full rounded-lg bg-neutral-900 px-4 py-3 text-base font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50 disabled:hover:bg-neutral-900 sm:w-auto sm:min-w-[140px]"
        >
          Continue
        </button>
      </form>
    </section>
  )
}

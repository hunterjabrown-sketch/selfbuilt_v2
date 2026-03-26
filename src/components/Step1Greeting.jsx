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
        <h2 className="font-headline text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">{title}</h2>
        <p className="mt-3 text-lg text-on-surface-variant">
          Describe your project in a sentence or two: a shelf, a desk, a small repair, or something bigger.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. A floating shelf next to my TV"
          className="sb-input"
          autoFocus
        />
        <button type="submit" disabled={!input.trim()} className="sb-btn-primary w-full sm:w-auto sm:min-w-[160px]">
          Continue
        </button>
      </form>
    </section>
  )
}

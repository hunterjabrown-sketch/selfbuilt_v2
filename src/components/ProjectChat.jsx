import { useState, useRef, useEffect } from 'react'

export default function ProjectChat({ projectIdea, guide }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (messages.length > 0) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || loading) return
    setInput('')
    setError(null)
    const userMessage = { role: 'user', content: trimmed }
    setMessages((prev) => [...prev, userMessage])
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectIdea: projectIdea || '',
          guide: guide || { summary: {}, steps: [] },
          messages: [...messages, userMessage],
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Chat failed')
      setMessages((prev) => [...prev, { role: 'assistant', content: data.message }])
    } catch (err) {
      setError(err.message || 'Something went wrong')
      setMessages((prev) => [...prev, { role: 'assistant', content: "I couldn't get a response. Please try again." }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="sb-card ghost-shadow overflow-hidden rounded-[1.25rem] border-outline-variant/20">
      <div className="border-b border-outline-variant/15 bg-surface-container-low/90 px-5 py-4">
        <h3 className="font-label text-xs font-extrabold uppercase tracking-[0.15em] text-secondary">Project assistant</h3>
        <p className="mt-1 text-sm text-on-surface-variant">Ask about this project: steps, materials, or troubleshooting.</p>
      </div>
      <div className="flex max-h-[320px] flex-col">
        <div className="min-h-[120px] flex-1 space-y-4 overflow-y-auto p-5">
          {messages.length === 0 && (
            <p className="text-sm text-on-surface-variant">Ask a question about your project or any step in the guide.</p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm ${
                  m.role === 'user' ? 'bg-primary text-on-primary shadow-sm' : 'bg-secondary/10 text-on-surface'
                }`}
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-xl bg-surface-container-high px-4 py-2.5 text-sm text-on-surface-variant">Thinking…</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        {error && <p className="px-5 pb-2 text-xs text-error">{error}</p>}
        <form onSubmit={handleSubmit} className="border-t border-outline-variant/15 bg-surface-container-lowest/50 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a step, material, or the project…"
              disabled={loading}
              className="sb-input flex-1 py-2.5 text-sm disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="sb-btn-dark shrink-0 px-5 py-2.5 text-sm"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

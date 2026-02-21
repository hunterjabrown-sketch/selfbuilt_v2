import { useState, useRef, useEffect } from 'react'

export default function ProjectChat({ projectIdea, guide }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
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
    <div className="rounded-xl border-2 border-neutral-200 bg-white overflow-hidden">
      <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-600">Project assistant</h3>
        <p className="text-xs text-neutral-500 mt-0.5">Ask about this project—steps, materials, or troubleshooting.</p>
      </div>
      <div className="flex flex-col max-h-[320px]">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[120px]">
          {messages.length === 0 && (
            <p className="text-sm text-neutral-500">Ask a question about your project or any step in the guide.</p>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  m.role === 'user'
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 text-neutral-800'
                }`}
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-lg bg-neutral-100 px-3 py-2 text-sm text-neutral-500">Thinking…</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        {error && (
          <p className="px-4 pb-2 text-xs text-red-600">{error}</p>
        )}
        <form onSubmit={handleSubmit} className="p-4 border-t border-neutral-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a step, material, or the project…"
              disabled={loading}
              className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="shrink-0 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

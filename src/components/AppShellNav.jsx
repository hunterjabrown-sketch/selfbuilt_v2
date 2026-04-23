import { FolderOpen, Box, ListChecks } from 'lucide-react'
import Logo from './Logo'

const tabs = [
  { id: 'saved', label: 'Saved projects', short: 'Saved', icon: FolderOpen },
  { id: 'workshop', label: 'Design workshop', short: 'Workshop', icon: Box },
  { id: 'guide', label: 'Builder Guide', short: 'Guide', icon: ListChecks },
]

/** Single-row shell header: brand left, tabs center, profile right. */
export default function AppShellNav({ value, onChange, rightSlot }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-outline-variant/20 bg-surface/95 px-4 backdrop-blur-sm sm:px-6">
      <div className="flex min-w-0 items-baseline gap-x-2 justify-self-start sm:gap-x-3">
        <Logo className="text-xl sm:text-2xl" />
        <p className="hidden truncate text-xs font-medium text-on-surface-variant md:block md:text-sm">
          AI-powered DIY build planner
        </p>
      </div>

      <nav className="flex items-stretch justify-center gap-0.5 justify-self-center sm:gap-1" aria-label="Main views">
        {tabs.map((t) => {
          const active = value === t.id
          const Icon = t.icon
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              className={`inline-flex h-16 items-center gap-1.5 border-b-2 px-2.5 text-sm font-semibold transition sm:px-4 ${
                active
                  ? 'border-secondary text-secondary'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
              <span className="hidden min-[520px]:inline">{t.label}</span>
              <span className="min-[520px]:hidden">{t.short}</span>
            </button>
          )
        })}
      </nav>

      <div className="flex items-center justify-end justify-self-end">
        {rightSlot}
      </div>
    </header>
  )
}

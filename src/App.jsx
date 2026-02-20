import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Step1Greeting from './components/Step1Greeting'
import Step2FollowUp from './components/Step2FollowUp'
import Step3Generating from './components/Step3Generating'
import Step4Guide from './components/Step4Guide'
import SavedProjects from './components/SavedProjects'
import { saveProject } from './lib/projects'

const STEPS = { greeting: 1, followUp: 2, generating: 3, guide: 4 }
const STORAGE_KEY = 'selfbuilt_guide'

function loadPersisted() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const { step, guide } = JSON.parse(raw)
    if (step === STEPS.guide && guide) return { step, guide }
  } catch (_) {}
  return null
}

function savePersisted(step, guide) {
  try {
    if (step === STEPS.guide && guide) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ step, guide }))
    } else {
      sessionStorage.removeItem(STORAGE_KEY)
    }
  } catch (_) {}
}

function AppContent() {
  const { user, authError, clearAuthError } = useAuth()
  const [view, setView] = useState('main')
  const [selectedSaved, setSelectedSaved] = useState(null) // { id, projectIdea, guide } when viewing a saved project
  const [step, setStep] = useState(STEPS.greeting)
  const [projectIdea, setProjectIdea] = useState('')
  const [answers, setAnswers] = useState({ dimensions: '', materialsAccess: '', experienceLevel: '' })
  const [media, setMedia] = useState([])
  const [guide, setGuide] = useState(null)
  const [error, setError] = useState(null)
  const [currentGuideSaved, setCurrentGuideSaved] = useState(false)
  const [savedListVersion, setSavedListVersion] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    const saved = loadPersisted()
    if (saved) {
      setStep(saved.step)
      setGuide(saved.guide)
    }
  }, [])

  const handleProjectSubmit = (idea) => {
    setProjectIdea(idea)
    setStep(STEPS.followUp)
  }

  const handleFollowUpSubmit = (nextAnswers, nextMedia) => {
    setAnswers(nextAnswers)
    setMedia(nextMedia)
    setStep(STEPS.generating)
    setError(null)
    generateGuide(projectIdea, nextAnswers, nextMedia)
  }

  async function generateGuide(idea, ans, files) {
    const payload = {
      projectIdea: idea,
      dimensions: ans.dimensions || undefined,
      materialsAccess: ans.materialsAccess || undefined,
      experienceLevel: ans.experienceLevel || undefined,
      media: files.map((f) => ({ type: 'image', mediaType: f.type, data: f.data })),
    }
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const text = await res.text()
      if (!text.trim()) {
        throw new Error('Server returned no response. Is the API running? Run "npm run server" in another terminal.')
      }
      let data
      try {
        data = JSON.parse(text)
      } catch {
        throw new Error(res.ok ? 'Invalid response from server' : `Server error: ${text.slice(0, 200)}`)
      }
      if (!res.ok) throw new Error(data.error || 'Request failed')
      setGuide(data)
      setStep(STEPS.guide)
      setCurrentGuideSaved(false)
      savePersisted(STEPS.guide, data)
    } catch (err) {
      setError(err.message)
      setStep(STEPS.followUp)
    }
  }

  const handleStartOver = () => {
    setStep(STEPS.greeting)
    setProjectIdea('')
    setAnswers({ dimensions: '', materialsAccess: '', experienceLevel: '' })
    setMedia([])
    setGuide(null)
    setError(null)
    setCurrentGuideSaved(false)
    savePersisted(STEPS.guide, null)
  }

  const handleSaveGuide = async (idea, guideData) => {
    if (!user) return
    try {
      await saveProject(user.uid, idea, guideData)
      setCurrentGuideSaved(true)
      setSavedListVersion((v) => v + 1)
    } catch (err) {
      console.error(err)
    }
  }

  const handleNewProject = () => {
    setSelectedSaved(null)
    setView('main')
    setStep(STEPS.greeting)
    setProjectIdea('')
    setAnswers({ dimensions: '', materialsAccess: '', experienceLevel: '' })
    setMedia([])
    setGuide(null)
    setError(null)
    setCurrentGuideSaved(false)
    savePersisted(STEPS.guide, null)
  }
  const handleSelectSavedProject = (project) => setSelectedSaved(project)

  return (
    <div className="flex min-h-screen bg-white">
      {user && sidebarOpen && (
        <Sidebar
          selectedProjectId={selectedSaved?.id}
          onSelectProject={handleSelectSavedProject}
          onClose={() => setSidebarOpen(false)}
          refreshTrigger={savedListVersion}
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          onOpenSaved={() => setView('saved')}
          currentView={view}
          hasSidebar={!!user}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((o) => !o)}
        />
        {authError && (
          <div className="bg-amber-100 border-b border-amber-300 px-4 py-3 text-amber-900">
            <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
              <p className="font-medium">Sign-in issue: {authError}</p>
              <button
                type="button"
                onClick={clearAuthError}
                className="shrink-0 rounded px-2 py-1 text-sm font-medium hover:bg-amber-200"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
        <main className="flex-1 overflow-auto bg-neutral-50/30">
          {selectedSaved ? (
            <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
              <Step4Guide
                guide={selectedSaved.guide}
                onStartOver={handleNewProject}
              />
            </div>
          ) : view === 'saved' ? (
            <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
              <SavedProjects onStartNew={() => setView('main')} />
            </div>
          ) : (
            <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
              {step === STEPS.greeting && (
                <Step1Greeting onSubmit={handleProjectSubmit} />
              )}
              {step === STEPS.followUp && (
                <Step2FollowUp
                  projectIdea={projectIdea}
                  initialAnswers={answers}
                  initialMedia={media}
                  onSubmit={handleFollowUpSubmit}
                  error={error}
                />
              )}
              {step === STEPS.generating && <Step3Generating />}
              {step === STEPS.guide && guide && (
                <Step4Guide
                  guide={guide}
                  projectIdea={projectIdea}
                  onStartOver={handleStartOver}
                  onSave={user ? handleSaveGuide : undefined}
                  isSaved={currentGuideSaved}
                />
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Header from './components/Header'
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
  const { user } = useAuth()
  const [view, setView] = useState('main') // 'main' | 'saved'
  const [step, setStep] = useState(STEPS.greeting)
  const [projectIdea, setProjectIdea] = useState('')
  const [answers, setAnswers] = useState({ dimensions: '', materialsAccess: '', experienceLevel: '' })
  const [media, setMedia] = useState([])
  const [guide, setGuide] = useState(null)
  const [error, setError] = useState(null)
  const [currentGuideSaved, setCurrentGuideSaved] = useState(false)

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
    } catch (err) {
      console.error(err)
    }
  }

  const handleOpenSaved = () => setView('saved')
  const handleBackToMain = () => setView('main')

  return (
    <div className="min-h-screen bg-white">
      <Header onOpenSaved={handleOpenSaved} currentView={view} />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        {view === 'saved' ? (
          <SavedProjects onStartNew={handleBackToMain} />
        ) : (
          <>
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
          </>
        )}
      </main>
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

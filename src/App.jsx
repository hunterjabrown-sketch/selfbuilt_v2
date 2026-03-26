import { useState, useEffect, useRef } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Step1Greeting from './components/Step1Greeting'
import Step2FollowUp from './components/Step2FollowUp'
import Step3Generating from './components/Step3Generating'
import Step4Guide from './components/Step4Guide'
import SavedProjects from './components/SavedProjects'
import { saveProject } from './lib/projects'
import { getProfile } from './lib/profile'
import Landing from './components/Landing'
import TermsGate from './components/TermsGate'

const STEPS = { greeting: 1, followUp: 2, generating: 3, guide: 4 }
const STORAGE_KEY = 'selfbuilt_guide'
const REQUIRED_TERMS_VERSION = '1'

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
  const [profileFirstName, setProfileFirstName] = useState('')
  const [projectIdea, setProjectIdea] = useState('')
  const [answers, setAnswers] = useState({
    designDescription: '',
    dimensions: '',
    materialsAccess: '',
    experienceLevel: '',
  })
  const [media, setMedia] = useState([])
  const [guide, setGuide] = useState(null)
  const [error, setError] = useState(null)
  const [savedListVersion, setSavedListVersion] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [saveError, setSaveError] = useState(null)
  const [profileVersion, setProfileVersion] = useState(0)
  const [clarification, setClarification] = useState(null)
  /** null = loading profile; true = terms accepted; false = must show Terms gate */
  const [termsAccepted, setTermsAccepted] = useState(null)

  // Restore previous guide only on refresh when already logged in (not on first sign-in)
  const prevUserRef = useRef(undefined)
  useEffect(() => {
    if (user) {
      const saved = loadPersisted()
      if (saved) {
        setStep(saved.step)
        setGuide(saved.guide)
      }
    }
  }, [])

  // When user just signs in (was null, now set), go to greeting and clear persisted guide
  useEffect(() => {
    if (user && prevUserRef.current === null) {
      sessionStorage.removeItem(STORAGE_KEY)
      setStep(STEPS.greeting)
      setGuide(null)
      setSelectedSaved(null)
    }
    prevUserRef.current = user ?? null
  }, [user])

  useEffect(() => {
    if (!user) {
      setProfileFirstName('')
      setTermsAccepted(null)
      return
    }
    setTermsAccepted(null)
    getProfile(user.uid)
      .then((profile) => {
        const acceptedLatestTerms =
          !!profile?.termsAcceptedAt && String(profile?.termsVersion || '') === REQUIRED_TERMS_VERSION
        setTermsAccepted(acceptedLatestTerms)
        const name = profile?.displayName || user.displayName || ''
        const first = name.trim().split(/\s+/)[0] || ''
        setProfileFirstName(first ? first.charAt(0).toUpperCase() + first.slice(1).toLowerCase() : '')
      })
      .catch(() => {
        setTermsAccepted(false)
        const name = user.displayName || ''
        const first = name.trim().split(/\s+/)[0] || ''
        setProfileFirstName(first ? first.charAt(0).toUpperCase() + first.slice(1).toLowerCase() : '')
      })
  }, [user, profileVersion])

  // Keep sidebar open on instructions/guide view so users can switch saved projects
  useEffect(() => {
    if ((step === STEPS.guide && guide) || selectedSaved) setSidebarOpen(true)
  }, [step, guide, selectedSaved])

  const mainRef = useRef(null)
  useEffect(() => {
    const onGuideOrProject = (step === STEPS.guide && guide) || selectedSaved
    const onNewProject = step === STEPS.greeting
    if (onGuideOrProject || onNewProject) {
      mainRef.current?.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [step, guide, selectedSaved])

  if (!user) {
    return (
      <>
        {authError && (
          <div className="fixed top-4 left-4 right-4 z-[100] mx-auto max-w-md rounded-lg bg-amber-100 border border-amber-300 px-4 py-3 text-amber-900 shadow-lg flex items-center justify-between gap-4">
            <p className="text-sm font-medium">{authError}</p>
            <button type="button" onClick={clearAuthError} className="shrink-0 rounded px-2 py-1 text-sm font-medium hover:bg-amber-200">Dismiss</button>
          </div>
        )}
        <Landing />
      </>
    )
  }

  const handleProjectSubmit = (idea) => {
    setProjectIdea(idea)
    setClarification(null)
    setStep(STEPS.followUp)
  }

  const handleFollowUpSubmit = (nextAnswers, nextMedia) => {
    setAnswers(nextAnswers)
    setMedia(nextMedia)
    setClarification(null)
    setStep(STEPS.generating)
    setError(null)
    generateGuide(projectIdea, nextAnswers, nextMedia)
  }

  async function generateGuide(idea, ans, files) {
    const payload = {
      projectIdea: idea,
      designDescription: ans.designDescription || undefined,
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
      if (data.outOfScope && data.message) {
        setError(data.message)
        setStep(STEPS.followUp)
        return
      }
      if (data.needsClarification) {
        setClarification({
          message: data.message || 'We need a few more details before generating a reliable guide.',
          questions: Array.isArray(data.questions) ? data.questions : [],
        })
        setError(null)
        setStep(STEPS.followUp)
        return
      }
      if (!Array.isArray(data.steps) || data.steps.length === 0) {
        setClarification({
          message: 'The guide response came back incomplete. Please add a little more detail so we can generate a better plan.',
          questions: [
            'What exact part of the house or room is this in?',
            'What are the key dimensions?',
            'What materials or tools do you already have?',
          ],
        })
        setStep(STEPS.followUp)
        return
      }
      setGuide(data)
      setStep(STEPS.guide)
      savePersisted(STEPS.guide, data)
      if (user) {
        setSaveError(null)
        try {
          await saveProject(user.uid, idea, data)
          setSavedListVersion((v) => v + 1)
        } catch (err) {
          console.error('Save to Saved projects failed:', err)
          const msg = err?.code === 'permission-denied'
            ? 'Permission denied. Deploy Firestore rules (see DEPLOY_FIRESTORE_RULES.md) and ensure you’re using the same Firebase project.'
            : err?.message || String(err)
          setSaveError(`Couldn’t save to Saved projects: ${msg}`)
        }
      }
    } catch (err) {
      setError(err.message)
      setStep(STEPS.followUp)
    }
  }

  const handleStartOver = () => {
    setSelectedSaved(null)
    setStep(STEPS.greeting)
    setProjectIdea('')
    setAnswers({ designDescription: '', dimensions: '', materialsAccess: '', experienceLevel: '' })
    setMedia([])
    setGuide(null)
    setError(null)
    setSaveError(null)
    setClarification(null)
    savePersisted(STEPS.guide, null)
  }

  const handleDeleteProject = (projectId) => {
    if (selectedSaved?.id === projectId) setSelectedSaved(null)
  }

  const handleNewProject = () => {
    setSelectedSaved(null)
    setView('main')
    setStep(STEPS.greeting)
    setProjectIdea('')
    setAnswers({ designDescription: '', dimensions: '', materialsAccess: '', experienceLevel: '' })
    setMedia([])
    setGuide(null)
    setError(null)
    setClarification(null)
    savePersisted(STEPS.guide, null)
  }
  const handleSelectSavedProject = (project) => setSelectedSaved(project)
  const showTermsGate = termsAccepted === false

  return (
    <div className="relative flex min-h-screen bg-surface font-body text-on-surface">
      {user && sidebarOpen && (
        <Sidebar
          selectedProjectId={selectedSaved?.id ?? (step === STEPS.guide && guide ? 'current' : null)}
          onSelectProject={handleSelectSavedProject}
          onDeleteProject={handleDeleteProject}
          onClose={() => setSidebarOpen(false)}
          onNewProject={() => handleNewProject()}
          refreshTrigger={savedListVersion}
          currentProject={step === STEPS.guide && guide && projectIdea ? { id: 'current', projectIdea, guide } : null}
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          onOpenSaved={() => setView('saved')}
          currentView={view}
          hasSidebar={!!user}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((o) => !o)}
          onProfileSaved={() => setProfileVersion((v) => v + 1)}
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
        <main ref={mainRef} className="flex-1 overflow-auto bg-surface">
          {selectedSaved ? (
            <div className="mx-auto max-w-5xl px-6 py-10 sm:px-8 sm:py-14">
              <Step4Guide
                guide={selectedSaved.guide}
                projectIdea={selectedSaved.projectIdea}
                onStartOver={handleNewProject}
              />
            </div>
          ) : view === 'saved' ? (
            <div className="mx-auto max-w-5xl px-6 py-10 sm:px-8 sm:py-14">
              <SavedProjects onStartNew={() => setView('main')} />
            </div>
          ) : (
            <div className="mx-auto max-w-5xl px-6 py-10 sm:px-8 sm:py-14">
              {step === STEPS.greeting && (
                <Step1Greeting firstName={profileFirstName} onSubmit={handleProjectSubmit} />
              )}
              {step === STEPS.followUp && (
                <Step2FollowUp
                  projectIdea={projectIdea}
                  initialAnswers={answers}
                  initialMedia={media}
                  onSubmit={handleFollowUpSubmit}
                  error={error}
                  clarification={clarification}
                />
              )}
              {step === STEPS.generating && <Step3Generating />}
              {step === STEPS.guide && guide && (
                <>
                  {saveError && (
                    <p className="mb-4 rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-900">{saveError}</p>
                  )}
                  <Step4Guide guide={guide} projectIdea={projectIdea} onStartOver={handleStartOver} />
                </>
              )}
            </div>
          )}
        </main>
      </div>
      {showTermsGate && <TermsGate user={user} onAccepted={() => { setTermsAccepted(true); setProfileVersion((v) => v + 1) }} />}
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

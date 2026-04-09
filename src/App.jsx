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
/** Bump when terms change; users below this must accept again (one-time per bump). */
const REQUIRED_TERMS_VERSION = '2'

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
  /** From Firestore profile; used when generating guides (not collected on the design step). */
  const [experienceLevel, setExperienceLevel] = useState('')
  const [projectIdea, setProjectIdea] = useState('')
  const [answers, setAnswers] = useState({
    designDescription: '',
    dimensions: '',
    materialsAccess: '',
  })
  const [media, setMedia] = useState([])
  const [guide, setGuide] = useState(null)
  const [error, setError] = useState(null)
  const [savedListVersion, setSavedListVersion] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [saveError, setSaveError] = useState(null)
  const [generationStatus, setGenerationStatus] = useState('idle')
  const [generationError, setGenerationError] = useState('')
  const [profileVersion, setProfileVersion] = useState(0)
  /** null = loading profile; true = terms accepted; false = must show Terms gate */
  const [termsAccepted, setTermsAccepted] = useState(null)
  /** Incremented when terms are accepted so Header opens Profile to collect name / experience. */
  const [profileOpenTrigger, setProfileOpenTrigger] = useState(0)
  const [profilePostTermsIntro, setProfilePostTermsIntro] = useState(false)
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
      setExperienceLevel('')
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
        setExperienceLevel(profile?.experienceLevel ?? '')
      })
      .catch(() => {
        setTermsAccepted(false)
        const name = user.displayName || ''
        const first = name.trim().split(/\s+/)[0] || ''
        setProfileFirstName(first ? first.charAt(0).toUpperCase() + first.slice(1).toLowerCase() : '')
        setExperienceLevel('')
      })
  }, [user, profileVersion])

  // Keep sidebar open on instructions/guide view so users can switch saved projects
  useEffect(() => {
    if ((step === STEPS.guide && guide) || selectedSaved) setSidebarOpen(true)
  }, [step, guide, selectedSaved])

  const mainRef = useRef(null)
  useEffect(() => {
    const onGuideOrProject = (step === STEPS.guide && guide) || selectedSaved
    const onProjectFlow = step === STEPS.greeting || step === STEPS.followUp
    if (onGuideOrProject || onProjectFlow) {
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
    setError(null)
    setStep(STEPS.followUp)
  }

  const handleFollowUpSubmit = (nextAnswers, nextMedia) => {
    setAnswers(nextAnswers)
    setMedia(nextMedia)
    setStep(STEPS.generating)
    setGenerationStatus('running')
    setGenerationError('')
    setError(null)
    generateGuide(nextAnswers, nextMedia)
  }

  async function generateGuide(ans, files) {
    const idea = projectIdea
    const payload = {
      projectIdea: idea,
      designDescription: ans.designDescription || undefined,
      dimensions: ans.dimensions || undefined,
      materialsAccess: ans.materialsAccess || undefined,
      experienceLevel: experienceLevel || undefined,
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
        setGenerationStatus('error')
        setGenerationError(data.message)
        return
      }
      if (!Array.isArray(data.steps) || data.steps.length === 0) {
        const msg = 'Could not generate a complete guide. Try again.'
        setError(msg)
        setGenerationStatus('error')
        setGenerationError(msg)
        return
      }
      const guideWithMeta = {
        ...data,
        _client: {
          dimensionsInput: (ans.dimensions || '').trim(),
        },
      }
      setGuide(guideWithMeta)
      setGenerationStatus('success')
      savePersisted(STEPS.guide, guideWithMeta)
      if (user) {
        setSaveError(null)
        try {
          await saveProject(user.uid, idea, guideWithMeta)
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
      const msg = err.message || 'Failed to generate guide'
      setError(msg)
      setGenerationStatus('error')
      setGenerationError(msg)
    }
  }

  const handleStartOver = () => {
    setSelectedSaved(null)
    setStep(STEPS.greeting)
    setProjectIdea('')
    setAnswers({ designDescription: '', dimensions: '', materialsAccess: '' })
    setMedia([])
    setGuide(null)
    setError(null)
    setSaveError(null)
    setGenerationStatus('idle')
    setGenerationError('')
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
    setAnswers({ designDescription: '', dimensions: '', materialsAccess: '' })
    setMedia([])
    setGuide(null)
    setError(null)
    setGenerationStatus('idle')
    setGenerationError('')
    savePersisted(STEPS.guide, null)
  }
  const handleSelectSavedProject = (project) => setSelectedSaved(project)

  const handleGuideUpdate = (nextGuide) => {
    setGuide(nextGuide)
    savePersisted(STEPS.guide, nextGuide)
  }

  const handleSavedProjectGuideUpdate = (nextGuide) => {
    setSelectedSaved((s) => (s ? { ...s, guide: nextGuide } : null))
  }

  const showTermsGate = termsAccepted === false

  return (
    <div className="relative flex h-screen min-h-0 overflow-hidden bg-surface font-body text-on-surface">
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
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Header
          onOpenSaved={() => setView('saved')}
          currentView={view}
          hasSidebar={!!user}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((o) => !o)}
          onProfileSaved={() => setProfileVersion((v) => v + 1)}
          profileOpenTrigger={profileOpenTrigger}
          profilePostTermsIntro={profilePostTermsIntro}
          onProfileIntroDismiss={() => setProfilePostTermsIntro(false)}
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
        <main ref={mainRef} className="min-h-0 flex-1 overflow-auto bg-surface">
          {selectedSaved ? (
            <div className="mx-auto max-w-5xl px-6 py-10 sm:px-8 sm:py-14">
              <Step4Guide
                guide={selectedSaved.guide}
                projectIdea={selectedSaved.projectIdea}
                savedProjectId={selectedSaved.id}
                experienceLevel={experienceLevel}
                onGuideChange={handleSavedProjectGuideUpdate}
                onStartOver={handleNewProject}
              />
            </div>
          ) : view === 'saved' ? (
            <div className="mx-auto max-w-5xl px-6 py-10 sm:px-8 sm:py-14">
              <SavedProjects onStartNew={() => setView('main')} experienceLevel={experienceLevel} />
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
                />
              )}
              {step === STEPS.generating && (
                <Step3Generating
                  generationStatus={generationStatus}
                  generationError={generationError}
                  onComplete={() => {
                    setStep(STEPS.guide)
                    setGenerationStatus('idle')
                    setGenerationError('')
                  }}
                  onBack={() => {
                    setStep(STEPS.followUp)
                    setGenerationStatus('idle')
                    setGenerationError('')
                  }}
                />
              )}
              {step === STEPS.guide && guide && (
                <>
                  {saveError && (
                    <p className="mb-4 rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-900">{saveError}</p>
                  )}
                  <Step4Guide
                    guide={guide}
                    projectIdea={projectIdea}
                    experienceLevel={experienceLevel}
                    onGuideChange={handleGuideUpdate}
                    onStartOver={handleStartOver}
                  />
                </>
              )}
            </div>
          )}
        </main>
      </div>
      {showTermsGate && (
        <TermsGate
          user={user}
          onAccepted={() => {
            setTermsAccepted(true)
            setProfileVersion((v) => v + 1)
            setProfilePostTermsIntro(true)
            setProfileOpenTrigger((t) => t + 1)
          }}
        />
      )}
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

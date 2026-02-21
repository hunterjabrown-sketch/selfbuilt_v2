import { useState } from 'react'
import Logo from './Logo'
import SignInModal from './SignInModal'

const EXAMPLE_GUIDE = {
  summary: {
    materials: ['1×8 pine board (6 ft)', '2×4 cleat (cut to length)', 'Wood screws (1¼")', 'Wall anchors', 'Sandpaper', 'Paint or stain (optional)'],
    tools: ['Drill with bits', 'Level', 'Stud finder', 'Pencil', 'Saw or have lumber cut at store'],
  },
  steps: [
    { number: 1, title: 'Find the studs', body: 'Use a stud finder to mark where the studs are behind the wall. You’ll anchor the cleat into studs for a strong hold. Mark the height you want the shelf with a pencil and level.' },
    { number: 2, title: 'Cut and mount the cleat', body: 'Cut the 2×4 cleat to the length of your shelf. Pre-drill holes, then screw the cleat into the studs. Check that it’s level before tightening all the way.' },
    { number: 3, title: 'Prepare and attach the shelf', body: 'Sand the 1×8 board and finish with paint or stain if you like. Rest the board on the cleat and secure from below with screws through the cleat into the shelf. Wipe clean and you’re done.' },
  ],
}

export default function Landing() {
  const [signInOpen, setSignInOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#faf9f7] text-neutral-900">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-4 sm:px-8 bg-[#faf9f7]/90 backdrop-blur-sm border-b border-neutral-200/60">
        <Logo className="text-lg sm:text-xl" />
        <button
          type="button"
          onClick={() => setSignInOpen(true)}
          className="rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-amber-950 hover:bg-amber-400 transition shadow-sm"
        >
          Sign up
        </button>
      </nav>
      <SignInModal isOpen={signInOpen} onClose={() => setSignInOpen(false)} />

      {/* Hero — reduced bottom padding so How it works is visible at fold */}
      <section className="relative pt-28 pb-12 sm:pt-36 sm:pb-16 px-4 sm:px-8 max-w-4xl mx-auto text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-amber-700/90 mb-4">
          The AI builder’s guide for your home
        </p>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-neutral-900 mb-6" style={{ fontFamily: 'Fraunces, Georgia, serif' }}>
          You can build it.
        </h1>
        <p className="text-lg sm:text-xl text-neutral-600 max-w-2xl mx-auto mb-4 leading-relaxed">
          Stop hiring out. Stop guessing. Get a custom, step-by-step guide for <strong className="text-neutral-800">any</strong> project—shelves, desks, repairs, outdoor builds—written for your skill level.
        </p>
        <p className="text-base text-neutral-500 max-w-xl mx-auto mb-10">
          Your first guide is free. No card. Just sign up and start building.
        </p>
        <button
          type="button"
          onClick={() => setSignInOpen(true)}
          className="inline-flex items-center justify-center rounded-full bg-amber-500 px-8 py-4 text-base font-semibold text-amber-950 hover:bg-amber-400 transition shadow-lg shadow-amber-500/25"
        >
          Sign up free
        </button>
        <p className="mt-4 text-sm text-neutral-500">
          Free to start · Save your projects · Cancel anytime
        </p>
      </section>

      {/* How it works — first under the fold, larger */}
      <section className="py-16 sm:py-24 px-4 sm:px-8 bg-white border-t border-neutral-200/80">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-2xl sm:text-3xl font-bold text-neutral-900 mb-4" style={{ fontFamily: 'Fraunces, Georgia, serif' }}>
            How it works
          </h2>
          <p className="text-center text-neutral-600 mb-12 max-w-xl mx-auto">Three steps from idea to finished project.</p>
          <div className="grid sm:grid-cols-3 gap-10 sm:gap-14">
            <div className="text-center">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700 font-bold text-lg mb-5">1</span>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Tell us your project</h3>
              <p className="text-base text-neutral-600 leading-relaxed">Describe what you want to build in plain English. One sentence is enough.</p>
            </div>
            <div className="text-center">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700 font-bold text-lg mb-5">2</span>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Get your custom guide</h3>
              <p className="text-base text-neutral-600 leading-relaxed">We generate materials, tools, and step-by-step instructions tailored to you.</p>
            </div>
            <div className="text-center">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700 font-bold text-lg mb-5">3</span>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Build with confidence</h3>
              <p className="text-base text-neutral-600 leading-relaxed">Follow the steps, save your guides, and tackle the next project.</p>
            </div>
          </div>
        </div>
      </section>

      {/* This is what you get: left = step-by-step, right = materials */}
      <section className="py-16 sm:py-24 px-4 sm:px-8 bg-[#faf9f7] border-t border-neutral-200/80">
        <div className="max-w-5xl mx-auto">
          <p className="text-amber-700/90 text-sm font-medium uppercase tracking-widest mb-2">Real output</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-2" style={{ fontFamily: 'Fraunces, Georgia, serif' }}>
            This is what you get
          </h2>
          <p className="text-neutral-600 text-sm mb-12 max-w-2xl">A real guide for a floating shelf. Yours will be custom to your project, space, and skill level.</p>

          <div className="grid sm:grid-cols-2 gap-10 sm:gap-16 items-start">
            {/* Left: step-by-step instructions */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500 mb-4">Step-by-step</h3>
              <ol className="space-y-4">
                {EXAMPLE_GUIDE.steps.map((s, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-amber-950">
                      {s.number}
                    </span>
                    <div>
                      <h4 className="font-semibold text-neutral-900">{s.title}</h4>
                      <p className="mt-0.5 text-sm text-neutral-600 leading-relaxed">{s.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Right: materials list */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500 mb-4">What you need</h3>
              <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
                <h4 className="text-sm font-semibold text-neutral-800 mb-2">Materials</h4>
                <ul className="text-sm text-neutral-600 space-y-1.5 mb-4">
                  {EXAMPLE_GUIDE.summary.materials.map((m, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-amber-600 mt-0.5">•</span>
                      {m}
                    </li>
                  ))}
                </ul>
                <h4 className="text-sm font-semibold text-neutral-800 mb-2">Tools</h4>
                <ul className="text-sm text-neutral-600 space-y-1.5">
                  {EXAMPLE_GUIDE.summary.tools.map((t, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-amber-600 mt-0.5">•</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Big: We save your projects */}
          <p className="mt-16 sm:mt-20 text-center text-xl sm:text-2xl md:text-3xl font-bold text-neutral-900" style={{ fontFamily: 'Fraunces, Georgia, serif' }}>
            We save your projects so you can go back anytime.
          </p>
        </div>
      </section>

      {/* Value props */}
      <section className="py-16 sm:py-24 px-4 sm:px-8 border-t border-neutral-200/80 bg-[#faf9f7]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-4 text-center" style={{ fontFamily: 'Fraunces, Georgia, serif' }}>
            Why people choose SelfBuilt
          </h2>
          <p className="text-neutral-600 text-center max-w-xl mx-auto mb-12">
            Whether you’ve never picked up a drill or you’re ready for something bigger—we meet you where you are.
          </p>
          <div className="grid sm:grid-cols-3 gap-8 sm:gap-12">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              </div>
              <h3 className="font-semibold text-neutral-900 mb-2">Any project, one place</h3>
              <p className="text-neutral-600 text-sm leading-relaxed">Shelves, desks, repairs, outdoor builds—describe it and get a complete guide. No more piecing together blog posts or skipping through videos.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="font-semibold text-neutral-900 mb-2">Clear steps, not clutter</h3>
              <p className="text-neutral-600 text-sm leading-relaxed">Materials and tools up front. Numbered steps written for your level. Save guides to your account and come back anytime.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              </div>
              <h3 className="font-semibold text-neutral-900 mb-2">Own every project</h3>
              <p className="text-neutral-600 text-sm leading-relaxed">Stop paying for simple fixes. Build the confidence to do it yourself—one project at a time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 sm:py-28 px-4 sm:px-8 bg-white border-t border-neutral-200/80">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-4" style={{ fontFamily: 'Fraunces, Georgia, serif' }}>
            Start building in under a minute
          </h2>
          <p className="text-neutral-600 mb-8">
            Sign up free. Get your first custom guide, save your projects, and cancel anytime. No card required.
          </p>
          <button
            type="button"
            onClick={() => setSignInOpen(true)}
            className="inline-flex items-center justify-center rounded-full bg-amber-500 px-8 py-4 text-base font-semibold text-amber-950 hover:bg-amber-400 transition shadow-lg shadow-amber-500/25"
          >
            Sign up free
          </button>
          <p className="mt-4 text-sm text-neutral-500">
            Join others who are building it themselves.
          </p>
        </div>
      </section>

      <footer className="py-8 px-4 text-center text-sm text-neutral-500 border-t border-neutral-200/60 bg-[#faf9f7]">
        <p className="font-medium text-neutral-700">SelfBuilt</p>
        <p className="mt-1">AI-powered DIY home improvement. You can build it.</p>
      </footer>
    </div>
  )
}

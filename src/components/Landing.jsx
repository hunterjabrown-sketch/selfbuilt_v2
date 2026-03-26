import { useRef, useState } from 'react'
import SignInModal from './SignInModal'

const fill = { fontVariationSettings: "'FILL' 1" }

export default function Landing() {
  const [signInOpen, setSignInOpen] = useState(false)
  const howItWorksRef = useRef(null)
  const builderGuideRef = useRef(null)
  const footerRef = useRef(null)

  const openSignIn = () => setSignInOpen(true)

  const scrollToHowItWorks = () => {
    howItWorksRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const scrollToBuilderGuide = () => {
    builderGuideRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const scrollToFooter = () => {
    footerRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen scroll-smooth bg-surface font-body text-on-surface selection:bg-secondary-fixed selection:text-on-secondary-fixed [zoom:0.92] md:[zoom:0.94]">
      <nav className="sticky top-0 z-50 w-full border-0 bg-surface shadow-none ring-0">
        <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3.5 sm:px-8 md:py-4">
          <div className="relative z-10 flex min-w-0 items-center gap-x-2.5 sm:gap-x-3">
            <a href="#top" className="font-headline text-xl font-bold leading-none tracking-tighter text-black shrink-0">
              SelfBuilt
            </a>
            <span className="font-body text-[11px] font-medium leading-snug text-neutral-500 sm:text-xs md:text-sm">
              AI-powered DIY build planner
            </span>
          </div>
          <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-7 font-['Manrope'] text-sm font-medium tracking-tight text-black md:flex lg:gap-9">
            <a className="border-b-2 border-[#1b6b51] py-1 font-semibold text-black" href="#top">
              Product
            </a>
            <a
              className="py-1 text-neutral-600 transition-colors hover:text-black"
              href="#inside-builder-guide"
              onClick={(e) => {
                e.preventDefault()
                scrollToBuilderGuide()
              }}
            >
              Guides
            </a>
            <a
              className="py-1 text-neutral-600 transition-colors hover:text-black"
              href="#site-footer"
              onClick={(e) => {
                e.preventDefault()
                scrollToFooter()
              }}
            >
              Community
            </a>
          </div>
          <button
            type="button"
            onClick={openSignIn}
            className="relative z-10 shrink-0 rounded-full bg-black px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 md:px-6 md:py-2.5"
          >
            Get Started
          </button>
        </div>
      </nav>

      <SignInModal isOpen={signInOpen} onClose={() => setSignInOpen(false)} />

      <main id="top">
        <section className="relative overflow-hidden pb-24 pt-12 md:pt-16">
          <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-8 lg:grid-cols-12">
            <div className="z-10 lg:col-span-7">
              <h1 className="mb-7 font-headline text-5xl font-extrabold leading-[1.08] tracking-tighter text-primary md:text-6xl">
                <span className="block">Build what you want</span>
                <span className="mt-1 block text-secondary">with confidence.</span>
              </h1>
              <p className="mb-9 max-w-xl font-body text-lg leading-relaxed text-on-surface-variant md:text-xl">
                Share your idea. Get clear steps, materials lists, and insights so you can build without second-guessing.
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={openSignIn}
                  className="flex items-center gap-3 rounded-xl bg-secondary px-8 py-4 text-lg font-bold text-on-secondary shadow-lg shadow-secondary/20 transition-transform hover:scale-[0.98]"
                >
                  Start Your Project
                  <span className="material-symbols-outlined text-xl">arrow_forward</span>
                </button>
                <button
                  type="button"
                  onClick={scrollToHowItWorks}
                  className="rounded-xl border border-outline-variant/10 bg-surface-container-highest px-8 py-4 text-lg font-bold text-primary transition-colors hover:bg-surface-container-high"
                >
                  See how it works
                </button>
              </div>
            </div>
            <div className="group relative lg:col-span-5">
              <div className="absolute -inset-4 -rotate-2 rounded-[2rem] bg-secondary/5 transition-transform duration-700 group-hover:rotate-0" />
              <div className="ghost-shadow relative aspect-[4/5] overflow-hidden rounded-[1.5rem] lg:aspect-square">
                <img
                  alt="Craftsperson working on a woodworking project"
                  className="h-full w-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuA9PwbC2XKeHx2EOWplxgbPzV-ue6YPiB8dUNmbjsvl1x4CFgyeLXkmIG9wB9hHDZh0nWb2OEqStC71d6l5zHv9JF3rgkLaQLIS5uKZ85Z9Dqsn1By7YLuoMFQJHmJ4tpZ0DkMQIj-2yp3gdeVrGTCYPdkhtrhnp_C2FFloT1v78D-b4ibWg8NgL9DSarJDVebPjTW-XvfaR-qfO9Zg4Qz_qMMUdI443us6nx3meZnc_O0l10WEzAvFN3DC5hln-BWPtVEFu-1vsaI"
                />
                <div className="glass-panel absolute bottom-6 left-6 right-6 rounded-xl border border-white/20 p-6">
                  <p className="mb-2 font-headline text-lg font-semibold italic leading-tight text-on-surface">
                    &ldquo;The precision of the blueprints saved me $4,200 on my deck remodel. It was like having a master builder over my
                    shoulder.&rdquo;
                  </p>
                  <span className="text-sm font-bold uppercase tracking-widest text-secondary">
                    — Henry C., Homeowner
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-secondary/20 bg-secondary/5 py-16 md:py-24">
          <div className="mx-auto max-w-4xl px-8 text-center">
            <span className="material-symbols-outlined mb-5 text-5xl text-secondary" style={fill}>
              construction
            </span>
            <h2 className="font-headline text-3xl font-extrabold leading-tight tracking-tighter text-primary md:text-4xl lg:text-[2.5rem]">
              SelfBuilt is a construction expert
            </h2>
            <p className="mt-6 font-body text-lg leading-relaxed text-on-surface-variant md:text-xl">
              It is built with the depth of knowledge you would expect from a construction master: how jobs are sequenced, what to watch for on site,
              and how to keep your build safe and square. Pro tips for your projects sit at your fingertips in every guide and in the project
              assistant, so you are never guessing alone in the garage or the yard.
            </p>
          </div>
        </section>

        <section id="how-it-works" ref={howItWorksRef} className="bg-surface-container-low py-24 md:py-28">
          <div className="mx-auto max-w-7xl px-8">
            <div className="mb-14 text-center">
              <h2 className="mb-4 font-headline text-3xl font-bold tracking-tight md:text-4xl">Simple steps. No guesswork.</h2>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-secondary/10 px-4 py-2 text-sm font-bold text-secondary">
                <span className="material-symbols-outlined text-sm" style={fill}>
                  handyman
                </span>
                Built for DIYers &amp; homeowners
              </div>
              <p className="mx-auto max-w-2xl font-body text-lg text-on-surface-variant">
                Here is the flow, so you can see how little friction there is between &ldquo;I have an idea&rdquo; and &ldquo;I have a plan.&rdquo;
              </p>
            </div>

            <div className="mb-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { step: '1', title: 'Describe your project', body: 'One or two sentences, or add a photo of your space so the guide fits your room.' },
                { step: '2', title: 'Answer a few questions', body: 'Dimensions, tools you have access to, and comfort level, so steps match reality.' },
                { step: '3', title: 'Get your guide', body: 'Materials, tools, and numbered steps in order. Everything in one place.' },
                { step: '4', title: 'Build & ask follow-ups', body: 'Follow the steps at your pace. Use the project assistant if something is unclear.' },
              ].map(({ step, title, body }) => (
                <div
                  key={step}
                  className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-6 text-left shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-bold text-on-secondary">
                    {step}
                  </div>
                  <h3 className="font-headline mb-2 text-lg font-bold text-primary">{title}</h3>
                  <p className="text-sm leading-relaxed text-on-surface-variant">{body}</p>
                </div>
              ))}
            </div>

            <div
              id="inside-builder-guide"
              ref={builderGuideRef}
              className="scroll-mt-24"
            >
            <p className="mb-10 text-center font-body text-sm font-medium text-on-surface-variant">
              Below is what a guide looks like inside the app: materials on one side, the current step on the other.
            </p>

            <div id="app-preview" className="mb-4 text-center">
              <h3 className="font-headline text-xl font-bold text-primary md:text-2xl">Inside your builder guide</h3>
            </div>
            <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-outline-variant/15 bg-surface-container-lowest ghost-shadow">
              <div className="flex items-center justify-between border-b border-surface-container-high bg-surface-container-low/50 px-8 py-5">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-error/20" />
                  <div className="h-3 w-3 rounded-full bg-secondary-container" />
                  <div className="h-3 w-3 rounded-full bg-primary-fixed" />
                  <span className="ml-4 font-label text-xs font-bold uppercase tracking-widest text-outline">Project: Floating Shelf Guide</span>
                </div>
                <span className="flex items-center gap-2 text-sm font-bold text-secondary">
                  <span className="material-symbols-outlined text-sm" style={fill}>
                    check_circle
                  </span>
                  Your guide is ready
                </span>
              </div>
              <div className="grid h-[600px] grid-cols-12">
                <div className="col-span-4 flex flex-col gap-8 border-r border-surface-container-high bg-surface-container p-8">
                  <div>
                    <span className="mb-6 block text-[10px] font-extrabold uppercase tracking-[0.2em] text-secondary">Materials Needed</span>
                    <ul className="space-y-4">
                      <li className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
                        <span className="text-sm font-medium">{`2" x 10" Pine Board`}</span>
                        <span className="font-bold text-secondary">4ft</span>
                      </li>
                      <li className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
                        <span className="text-sm font-medium">Heavy Duty Brackets</span>
                        <span className="font-bold text-secondary">2x</span>
                      </li>
                      <li className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
                        <span className="text-sm font-medium">3&quot; Wood Screws</span>
                        <span className="font-bold text-secondary">12x</span>
                      </li>
                    </ul>
                  </div>
                  <div className="mt-auto rounded-xl bg-primary p-5 text-on-primary">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest opacity-60">Labor you did not pay for</p>
                    <p className="text-3xl font-extrabold tracking-tighter text-secondary-fixed">~$450</p>
                    <p className="mt-2 text-[10px] leading-snug opacity-70">
                      Example: many projects avoid hundreds to thousands in labor by DIYing. Actual savings depend on your project and local rates.
                    </p>
                  </div>
                </div>
                <div className="col-span-8 flex flex-col bg-surface p-10">
                  <div className="mb-8 flex items-center justify-between">
                    <div>
                      <h3 className="font-headline text-2xl font-extrabold">Mark and Measure</h3>
                      <p className="mt-1 text-sm font-bold text-secondary">Step 1 of 8</p>
                    </div>
                    <div className="h-1.5 w-32 rounded-full bg-surface-container-high">
                      <div className="h-full w-[12.5%] rounded-full bg-secondary" />
                    </div>
                  </div>
                  <div className="grid flex-1 grid-cols-2 gap-8">
                    <div className="relative overflow-hidden rounded-2xl border border-outline-variant/10 bg-surface-container shadow-inner">
                      <img
                        alt="Woodworking measurement detail"
                        className="h-full w-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDYe-BI7FHVchFp1b2bowuU6utbS6soAI4F2-4x3Ma7q8qzeN6aS8rqfNwT5qdKE7GI6Qr34Kz121sjK9BipuerQXHY07zCyJ9fJhETchpMNDOzJ57r2CfziWOK1BTukz0dhB8RTD8gt5sdKvXYbAOeD5ovmK0zCTTdfdQQHSLjHS9zIEsDicRr0hIm5jqrfSj-uuiJFNDGpKzKGV3HJIlx0Dsvn08JKBmUwYJB6XA6t6HFp2DZ8yW7-ceYuZIGlasC1LhFSSIZhGM"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform hover:scale-110">
                          <span className="material-symbols-outlined text-3xl text-secondary" style={fill}>
                            play_arrow
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <p className="mb-8 text-lg leading-relaxed text-on-surface-variant">
                        Use a speed square to mark two parallel lines 16 inches apart. This ensures your brackets align with the wall studs later.
                      </p>
                      <div className="mt-auto rounded-2xl border border-secondary/10 bg-secondary/5 p-5">
                        <div className="mb-2 flex items-center gap-3 text-secondary">
                          <span className="material-symbols-outlined text-sm">lightbulb</span>
                          <span className="text-xs font-bold uppercase tracking-wider">Pro Tip</span>
                        </div>
                        <p className="text-sm text-on-surface-variant">
                          Double-check your vertical level before marking. Even 1/16th of an inch matters for floating shelves.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-10 flex justify-end">
                    <button
                      type="button"
                      onClick={openSignIn}
                      className="flex items-center gap-2 rounded-xl bg-secondary px-10 py-4 text-sm font-bold tracking-tight text-on-secondary transition-opacity hover:opacity-90"
                    >
                      Next Step
                      <span className="material-symbols-outlined text-sm">chevron_right</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>
        </section>

        <section className="bg-surface py-24 md:py-28">
          <div className="mx-auto max-w-7xl px-8">
            <div className="mb-20 flex flex-col justify-between gap-8 md:flex-row md:items-end">
              <div className="max-w-xl">
                <span className="font-label mb-4 block text-xs font-bold uppercase tracking-widest text-secondary">For people who build at home</span>
                <h2 className="font-headline text-4xl font-extrabold tracking-tighter md:text-5xl">Everything you need to follow through</h2>
              </div>
              <p className="font-body max-w-sm text-lg text-on-surface-variant md:text-right">
                Clear steps, real lists, and room to ask questions, so DIY is not a leap of faith.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
              <div className="group relative overflow-hidden rounded-[1.5rem] border border-outline-variant/10 bg-surface-container-low p-10 transition-colors hover:bg-surface-container md:col-span-8">
                <div className="relative z-10 flex h-full flex-col">
                  <span className="material-symbols-outlined mb-6 text-4xl text-secondary" style={fill}>
                    architecture
                  </span>
                  <h3 className="font-headline mb-4 text-3xl font-bold">Guides that match your project</h3>
                  <p className="max-w-md text-lg leading-relaxed text-on-surface-variant">
                    Materials, tools, and ordered steps tuned to what you said you are building, so you are not piecing together random tutorials.
                  </p>
                </div>
                <img
                  alt=""
                  className="absolute right-0 top-0 h-full w-1/3 object-cover opacity-10 transition-opacity duration-700 group-hover:opacity-20"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCuFl9b5169G8KTZp3kmYzZmLuqHLYyXFC4Luc3D-t9Bd5mcEYLQsMj7Elb6LwU--ffGB3J91DhwL5aTW491-xYBQZ_Ucyd2lM4KOEeZ8MtETBFbJPZ1QITWWKOZPSByVSZTFWCgyKQ3mtnPU3LMgRgBctDK76-IxnQ0ARzkg4BQkKRUncTRP3ZP19KnthT9e9QSg5mAzkbPqXGgoa_QTNlxuxMBWQkxMh6eR5AU_pBkbF9vQJqMwUPgZYhvmr6NMnk_GBEVmdVAl8"
                />
              </div>
              <div className="flex flex-col justify-between rounded-[1.5rem] bg-primary p-10 text-on-primary md:col-span-4">
                <div>
                  <span className="material-symbols-outlined mb-6 text-4xl text-secondary-fixed" style={fill}>
                    shopping_cart
                  </span>
                  <h3 className="font-headline mb-4 text-2xl font-bold">Lists you can use</h3>
                  <p className="text-base text-on-primary/70">
                    Materials and tools in one view. Take the list to the store or your garage and check things off as you go.
                  </p>
                </div>
                <div className="mt-8 border-t border-white/10 pt-8">
                  <span className="flex items-center gap-2 text-sm font-bold text-secondary-fixed">
                    Fewer trips, fewer “did I forget something?” moments
                    <span className="material-symbols-outlined text-sm">check</span>
                  </span>
                </div>
              </div>
              <div className="flex flex-col justify-between rounded-[1.5rem] bg-secondary p-10 text-on-secondary md:col-span-4">
                <div>
                  <span className="material-symbols-outlined mb-6 text-4xl text-on-secondary" style={fill}>
                    recycling
                  </span>
                  <h3 className="font-headline mb-4 text-2xl font-bold">Waste Reduction</h3>
                  <p className="text-base text-on-secondary/80">
                    We calculate the exact cuts to minimize leftover lumber and save on material costs.
                  </p>
                </div>
                <div className="mt-8 border-t border-white/15 pt-8">
                  <p className="font-headline text-2xl font-extrabold tracking-tight text-secondary-fixed">Avg. 22% less waste</p>
                  <span className="mt-2 block text-xs opacity-80">Fewer offcuts, less money left on the scrap pile</span>
                </div>
              </div>
              <div className="group flex items-center justify-between overflow-hidden rounded-[1.5rem] border border-outline-variant/20 bg-surface-container-high p-10 md:col-span-8">
                <div className="max-w-md">
                  <span className="material-symbols-outlined mb-6 text-4xl text-primary" style={fill}>
                    videocam
                  </span>
                  <h3 className="font-headline mb-4 text-3xl font-bold">Steps you can follow</h3>
                  <p className="text-lg leading-relaxed text-on-surface-variant">
                    One step at a time, in order, plus a project assistant when you need a phrase decoded or a step clarified.
                  </p>
                </div>
                <div className="relative hidden lg:block">
                  <div className="h-48 w-48 animate-[spin_20s_linear_infinite] rounded-full border-4 border-dashed border-secondary/30 transition-transform group-hover:scale-110" />
                  <span className="material-symbols-outlined absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl text-secondary">school</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-secondary/25 bg-secondary/5 py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-8">
            <div className="text-center">
              <span className="font-label mb-3 inline-block text-xs font-bold uppercase tracking-widest text-secondary">Labor is usually the biggest check</span>
              <h2 className="font-headline text-3xl font-extrabold leading-tight tracking-tighter text-primary md:text-4xl lg:text-5xl">
                Keep the labor savings in your pocket, <span className="text-secondary">not on a contractor invoice.</span>
              </h2>
              <p className="mx-auto mt-6 max-w-3xl font-body text-lg leading-relaxed text-on-surface-variant md:text-xl">
                When you hire out, you are not just buying materials. You are paying for crew time, scheduling, markup, and profit on labor, often the
                largest line on the quote. When you DIY with a solid plan, that labor spend largely disappears. What you save depends on scope and
                where you live, but the gap is usually measured in hundreds or thousands, not pocket change.
              </p>
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-3">
              <div className="rounded-2xl border border-secondary/20 bg-white/80 p-6 text-center shadow-sm md:p-8">
                <p className="font-headline text-3xl font-extrabold tracking-tight text-secondary md:text-4xl">$100s–$1k+</p>
                <p className="mt-2 font-body text-sm font-semibold text-primary">Smaller projects</p>
                <p className="mt-2 font-body text-sm leading-relaxed text-on-surface-variant">
                  Shelves, minor carpentry, single-room fixes. Labor quotes still add up fast versus doing it yourself with a clear sequence.
                </p>
              </div>
              <div className="rounded-2xl border border-secondary/20 bg-white/80 p-6 text-center shadow-sm ring-2 ring-secondary/25 md:p-8">
                <p className="font-headline text-3xl font-extrabold tracking-tight text-secondary md:text-4xl">$1k–$5k+</p>
                <p className="mt-2 font-body text-sm font-semibold text-primary">Room-scale &amp; outdoor</p>
                <p className="mt-2 font-body text-sm leading-relaxed text-on-surface-variant">
                  Built-ins, decks, fences, bigger carpentry. These are the jobs where contractor labor often dominates the bid.
                </p>
              </div>
              <div className="rounded-2xl border border-secondary/20 bg-white/80 p-6 text-center shadow-sm md:p-8">
                <p className="font-headline text-3xl font-extrabold tracking-tight text-secondary md:text-4xl">$4k+</p>
                <p className="mt-2 font-body text-sm font-semibold text-primary">Real homeowner outcome</p>
                <p className="mt-2 font-body text-sm leading-relaxed text-on-surface-variant">
                  One SelfBuilt user reported about $4,200 saved on a deck remodel from precision planning alone. Your results will vary.
                </p>
              </div>
            </div>
            <p className="mx-auto mt-10 max-w-2xl text-center font-body text-sm leading-relaxed text-on-surface-variant">
              SelfBuilt does not replace a licensed contractor where code or safety requires one. It helps you execute the work you choose to do
              yourself with less paid labor on the line.
            </p>
          </div>
        </section>

        <section className="py-28 md:py-32">
          <div className="mx-auto max-w-4xl px-8 text-center">
            <h2 className="mb-8 font-headline text-4xl font-extrabold tracking-tighter md:text-5xl">Ready to build with confidence?</h2>
            <p className="mb-12 max-w-2xl mx-auto font-body text-lg text-on-surface-variant md:text-xl">
              Design with your imagination. Build with a designated plan that turns your idea into something real.
            </p>
            <button
              type="button"
              onClick={openSignIn}
              className="ghost-shadow rounded-xl bg-secondary px-12 py-5 text-xl font-bold text-on-secondary shadow-xl shadow-secondary/30 transition-all hover:scale-[0.98]"
            >
              Start Your Project Now
            </button>
            <p className="mt-8 font-label text-xs font-bold uppercase tracking-[0.2em] text-outline">Available for desktop</p>
          </div>
        </section>
      </main>

      <footer id="site-footer" ref={footerRef} className="w-full bg-[#f0edef] py-12 dark:bg-slate-900">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-8 md:flex-row">
          <div className="flex flex-col items-center gap-2 md:items-start">
            <span className="font-headline text-lg font-bold text-[#0F172A] dark:text-slate-50">SelfBuilt</span>
            <p className="text-center font-['Inter'] text-xs uppercase tracking-widest text-slate-500 md:text-left">
              © {new Date().getFullYear()} SelfBuilt. Build with confidence and architectural integrity.
            </p>
          </div>
          <div className="flex items-center gap-8">
            <span className="font-['Inter'] text-xs uppercase tracking-widest text-slate-500">Privacy</span>
            <span className="font-['Inter'] text-xs uppercase tracking-widest text-slate-500">Terms</span>
            <span className="font-['Inter'] text-xs uppercase tracking-widest text-slate-500">Contact</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

import NoirBackground from './components/ui/NoirBackground'
import GlassNavbar from './components/ui/GlassNavbar'
import ShinyButton from './components/ui/ShinyButton'
import SectionHeading from './components/ui/SectionHeading'
import ToolCollection from './components/ui/ToolCollection'
import Footer from './components/Footer'

interface HomeScreenProps {
  onLogin: () => void
  onSignUp: () => void
  onJsonParser: () => void
}

/* ── Icons ── */

function BracesIcon(): React.ReactElement {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1" />
      <path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1" />
    </svg>
  )
}

function DiffIcon(): React.ReactElement {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v14" />
      <path d="M5 10h14" />
      <path d="M5 21h14" />
    </svg>
  )
}

function HashIcon(): React.ReactElement {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" x2="20" y1="9" y2="9" />
      <line x1="4" x2="20" y1="15" y2="15" />
      <line x1="10" x2="8" y1="3" y2="21" />
      <line x1="16" x2="14" y1="3" y2="21" />
    </svg>
  )
}

function MailIcon(): React.ReactElement {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

function ShieldIcon(): React.ReactElement {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  )
}

function RegexIcon(): React.ReactElement {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3v10" />
      <path d="m12.67 5.5 8.66 5" />
      <path d="m12.67 10.5 8.66-5" />
      <path d="M9 17a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2z" />
    </svg>
  )
}

export default function HomeScreen({ onLogin, onSignUp, onJsonParser }: HomeScreenProps): React.ReactElement {
  return (
    <NoirBackground>
      <GlassNavbar
        onLogin={onLogin}
        onSignUp={onSignUp}
        links={[
          { label: 'Tools', onClick: () => document.getElementById('tools-section')?.scrollIntoView({ behavior: 'smooth' }) },
        ]}
      />

      {/* Hero */}
      <section className="min-h-screen flex flex-col items-center justify-center pt-32 pb-20 px-6">
        <div className="text-center max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-noir-border backdrop-blur-md mb-8 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-red" />
            </span>
            <span className="text-xs font-medium text-red-100/90 tracking-wide font-manrope">
              New tools added regularly
            </span>
          </div>

          <h1 className="text-6xl md:text-8xl font-semibold tracking-tighter font-manrope leading-[1.1] mb-8 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <span className="block text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40">
              Your Developer
            </span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40">
              <span className="text-accent-red inline-block relative">
                Toolkit
                <svg className="absolute w-full h-3 -bottom-2 left-0 text-accent-red opacity-60" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
              </span>
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed animate-fade-up" style={{ animationDelay: '0.3s' }}>
            A growing collection of fast, focused developer tools — right in your browser. Parse, format, validate, and transform with zero friction.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-6 animate-fade-up" style={{ animationDelay: '0.4s' }}>
            <ShinyButton onClick={onJsonParser}>
              Try JSON Parser <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
            </ShinyButton>

            <button
              type="button"
              onClick={onSignUp}
              className="group px-8 py-4 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 font-medium hover:text-white hover:bg-zinc-800 transition-all flex items-center gap-2"
            >
              Create Account
            </button>
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section id="tools-section" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <SectionHeading
            title="Developer Tools,"
            accent="Built Right"
            subtitle="Each tool is designed to do one thing well — fast, clean, and with zero setup."
          />

          <ToolCollection
            label="Data & Parsing"
            description="Parse, compare, and transform structured data."
            tools={[
              {
                icon: <BracesIcon />,
                title: 'JSON Parser',
                description: 'Paste, parse, and explore JSON with syntax highlighting, tree navigation, search, and real-time validation.',
                accentColor: 'var(--color-accent-red)',
                onClick: onJsonParser,
              },
              {
                icon: <DiffIcon />,
                title: 'Diff Checker',
                description: 'Compare two blocks of text or code side-by-side with highlighted additions, deletions, and changes.',
                accentColor: 'var(--color-accent-amber)',
                comingSoon: true,
              },
              {
                icon: <HashIcon />,
                title: 'Encoder / Decoder',
                description: 'Base64, URL encoding, HTML entities — encode and decode strings in every common format.',
                accentColor: 'var(--color-accent-cyan)',
                comingSoon: true,
              },
            ]}
          />

          <ToolCollection
            label="Privacy & Identity"
            description="Disposable identities and security utilities for testing and development."
            tools={[
              {
                icon: <MailIcon />,
                title: 'Burner Email',
                description: 'Generate temporary email addresses for sign-up flows, testing, and keeping your inbox clean.',
                accentColor: 'var(--color-accent-purple)',
                comingSoon: true,
              },
              {
                icon: <ShieldIcon />,
                title: 'Password Generator',
                description: 'Create strong, random passwords with customizable length, character sets, and entropy display.',
                accentColor: 'var(--color-accent-green)',
                comingSoon: true,
              },
            ]}
          />

          <ToolCollection
            label="Text & Code"
            description="Format, test, and preview text and code snippets."
            tools={[
              {
                icon: <RegexIcon />,
                title: 'Regex Tester',
                description: 'Write and test regular expressions with real-time match highlighting and group extraction.',
                accentColor: 'var(--color-accent-blue)',
                comingSoon: true,
              },
            ]}
          />
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-6 text-center bg-zinc-950/40">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-5xl md:text-7xl font-bold font-manrope mb-8 tracking-tighter">
            Ready to <span className="text-accent-red">Build?</span>
          </h2>
          <p className="text-xl text-zinc-400 mb-12">
            Create a free account to save preferences, access all tools, and get notified when new ones drop.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={onSignUp}
              className="bg-accent-red hover:bg-red-700 text-white font-bold rounded-full px-8 py-4 transition-all"
            >
              Get Started Free
            </button>
            <button
              type="button"
              onClick={onLogin}
              className="text-zinc-400 hover:text-white font-medium rounded-full px-8 py-4 transition-colors"
            >
              Already have an account?
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </NoirBackground>
  )
}

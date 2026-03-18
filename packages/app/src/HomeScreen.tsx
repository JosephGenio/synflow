import NoirBackground from './components/ui/NoirBackground'
import GlassNavbar from './components/ui/GlassNavbar'
import ShinyButton from './components/ui/ShinyButton'
import SectionHeading from './components/ui/SectionHeading'
import ToolCollection from './components/ui/ToolCollection'
import Footer from './components/Footer'
import { getToolCollections } from './tools/toolsData'

interface HomeScreenProps {
  onLogin?: () => void
  onSignUp?: () => void
  onJsonParser?: () => void
  onBurnerEmail?: () => void
  onToolsCollection?: () => void
}

export default function HomeScreen({ onLogin, onSignUp, onJsonParser, onBurnerEmail, onToolsCollection }: HomeScreenProps): React.ReactElement {
  const collections = getToolCollections({ onJsonParser, onBurnerEmail })

  return (
    <NoirBackground>
      <GlassNavbar
        onLogin={onLogin}
        onSignUp={onSignUp}
        links={[
          ...(onToolsCollection ? [{ label: 'Tools', onClick: onToolsCollection }] : []),
          { label: 'About', onClick: () => {} },
          { label: 'Contact', onClick: () => {} },
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
            <ShinyButton onClick={() => document.getElementById('tools-section')?.scrollIntoView({ behavior: 'smooth' })}>
              Explore Tools <span className="transition-transform group-hover:translate-x-1">&darr;</span>
            </ShinyButton>

            {onSignUp && (
              <button
                type="button"
                onClick={onSignUp}
                className="group px-8 py-4 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 font-medium hover:text-white hover:bg-zinc-800 transition-all flex items-center gap-2"
              >
                Create Account
              </button>
            )}
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

          {collections.map((collection) => (
            <ToolCollection
              key={collection.label}
              label={collection.label}
              description={collection.description}
              tools={collection.tools}
            />
          ))}

          {onToolsCollection && (
            <div className="mt-12 text-center">
              <button
                type="button"
                onClick={onToolsCollection}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-full border border-noir-border text-zinc-300 hover:text-white hover:border-white/20 transition-all font-medium text-sm"
              >
                Explore More
                <span>&rarr;</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* CTA — only shown when auth is enabled */}
      {(onLogin || onSignUp) && (
        <section className="py-32 px-6 text-center bg-zinc-950/40">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-5xl md:text-7xl font-bold font-manrope mb-8 tracking-tighter">
              Ready to <span className="text-accent-red">Build?</span>
            </h2>
            <p className="text-xl text-zinc-400 mb-12">
              Create a free account to save preferences, access all tools, and get notified when new ones drop.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {onSignUp && (
                <button
                  type="button"
                  onClick={onSignUp}
                  className="bg-accent-red hover:bg-red-700 text-white font-bold rounded-full px-8 py-4 transition-all"
                >
                  Get Started Free
                </button>
              )}
              {onLogin && (
                <button
                  type="button"
                  onClick={onLogin}
                  className="text-zinc-400 hover:text-white font-medium rounded-full px-8 py-4 transition-colors"
                >
                  Already have an account?
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </NoirBackground>
  )
}

import NoirBackground from './components/ui/NoirBackground'
import GlassNavbar from './components/ui/GlassNavbar'
import SectionHeading from './components/ui/SectionHeading'
import FeatureCard from './components/ui/FeatureCard'
import Footer from './components/Footer'

interface AboutScreenProps {
  onHome?: () => void
  onLogin?: () => void
  onSignUp?: () => void
  onContact?: () => void
  onToolsCollection?: () => void
}

export default function AboutScreen({
  onHome,
  onLogin,
  onSignUp,
  onContact,
  onToolsCollection,
}: AboutScreenProps): React.ReactElement {
  return (
    <NoirBackground>
      <GlassNavbar
        onLogin={onLogin}
        onSignUp={onSignUp}
        onBrandClick={onHome}
        links={[
          ...(onToolsCollection ? [{ label: 'Tools', onClick: onToolsCollection }] : []),
          { label: 'Contact', onClick: onContact },
        ]}
      />

      {/* Hero */}
      <section className="min-h-screen flex flex-col items-center justify-center pt-32 pb-20 px-6">
        <div className="text-center max-w-5xl mx-auto">
          <h1 className="text-6xl md:text-8xl font-semibold tracking-tighter font-manrope leading-[1.1] mb-8 animate-fade-up">
            <span className="block text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40">
              About
            </span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40">
              <span className="text-accent-red">Synflo</span>
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed animate-fade-up">
            We believe developers deserve tools that just work. No setup, no bloat, no friction.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-32 px-6 border-t border-noir-border">
        <div className="max-w-4xl mx-auto">
          <SectionHeading
            title="Our Mission"
            accent="Simple & Focused"
            subtitle="Build a growing collection of developer tools that are fast, focused, and free."
          />

          <div className="mt-16 space-y-8 text-zinc-300 text-lg leading-relaxed">
            <p>
              Synflo was born from a simple frustration: every developer needs quick utilities — JSON parsers, text formatters, validators — but most tools either come with unnecessary features or require setup and installation.
            </p>

            <p>
              We decided to create a different kind of toolkit. One that lives in your browser, does one thing well, and gets out of your way.
            </p>

            <p>
              Every tool on Synflo is designed with a single principle: <span className="text-white font-semibold">simplicity first</span>. No ads. No tracking. No unnecessary complexity. Just fast, focused tools for developers.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <SectionHeading
            title="Our Values"
            accent="What We Stand For"
            subtitle="These principles guide every decision we make."
          />

          <div className="mt-16 grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon="⚡"
              title="Speed First"
              description="Tools should be instant. No waiting, no loading. Optimized for performance."
            />
            <FeatureCard
              icon="🎯"
              title="One Thing Well"
              description="Each tool does one job and does it right. No feature creep, no bloat."
            />
            <FeatureCard
              icon="🔒"
              title="Privacy Matters"
              description="Your data is yours. No tracking, no analytics, no ads. Ever."
            />
          </div>
        </div>
      </section>

      {/* Tech */}
      <section className="py-32 px-6 border-t border-noir-border">
        <div className="max-w-4xl mx-auto">
          <SectionHeading
            title="Built With"
            accent="Modern Tech Stack"
            subtitle="Synflo is built on proven, modern technologies."
          />

          <div className="mt-16 grid md:grid-cols-2 gap-8 text-zinc-300">
            <div>
              <h3 className="text-white font-semibold text-lg mb-2">Frontend</h3>
              <p className="text-zinc-400">React 18 with TypeScript, Vite, and Tailwind CSS for a blazing-fast experience.</p>
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg mb-2">Backend</h3>
              <p className="text-zinc-400">Express.js with PostgreSQL for reliable, scalable APIs and data persistence.</p>
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg mb-2">Deployment</h3>
              <p className="text-zinc-400">Oracle Cloud Infrastructure for infrastructure, Vercel for the frontend.</p>
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg mb-2">Code Quality</h3>
              <p className="text-zinc-400">TypeScript, ESLint, and Jest for type safety and test coverage.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      {onContact && (
        <section className="py-32 px-6 text-center bg-zinc-950/40">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-5xl md:text-6xl font-bold font-manrope mb-8 tracking-tighter">
              Get in <span className="text-accent-red">Touch</span>
            </h2>
            <p className="text-xl text-zinc-400 mb-8">Have questions, feedback, or just want to say hello? We'd love to hear from you.</p>
            <button
              type="button"
              onClick={onContact}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-accent-red hover:bg-red-700 text-white font-semibold transition-all"
            >
              Contact Us
              <span>&rarr;</span>
            </button>
          </div>
        </section>
      )}

      <Footer />
    </NoirBackground>
  )
}

import NoirBackground from './components/ui/NoirBackground'
import GlassNavbar from './components/ui/GlassNavbar'
import SectionHeading from './components/ui/SectionHeading'
import Footer from './components/Footer'
import contactInfo from './contact.json'

interface ContactScreenProps {
  onHome?: () => void
  onLogin?: () => void
  onSignUp?: () => void
  onAbout?: () => void
  onToolsCollection?: () => void
}

export default function ContactScreen({
  onHome,
  onLogin,
  onSignUp,
  onAbout,
  onToolsCollection,
}: ContactScreenProps): React.ReactElement {
  return (
    <NoirBackground>
      <GlassNavbar
        onLogin={onLogin}
        onSignUp={onSignUp}
        onBrandClick={onHome}
        links={[
          ...(onToolsCollection ? [{ label: 'Tools', onClick: onToolsCollection }] : []),
          { label: 'About', onClick: onAbout },
        ]}
      />

      {/* Hero */}
      <section className="min-h-screen flex flex-col items-center justify-center pt-32 pb-20 px-6">
        <div className="text-center max-w-5xl mx-auto">
          <h1 className="text-6xl md:text-8xl font-semibold tracking-tighter font-manrope leading-[1.1] mb-8 animate-fade-up">
            <span className="block text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40">
              Get in
            </span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40">
              <span className="text-accent-red">Touch</span>
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed animate-fade-up">
            Have questions, feedback, or ideas? We'd love to hear from you. Reach out using any of the methods below.
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <SectionHeading
            title="Contact Information"
            accent="Let's Connect"
            subtitle="Pick your preferred way to reach out."
          />

          <div className="mt-16 space-y-8">
            {/* Email */}
            {contactInfo.email && (
              <div className="group">
                <div className="flex items-start gap-4 p-6 rounded-lg border border-noir-border bg-noir-bg hover:bg-noir-bg/80 hover:border-white/20 transition-all cursor-pointer">
                  <div className="text-3xl flex-shrink-0">✉️</div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-lg mb-2">Email</h3>
                    <a
                      href={`mailto:${contactInfo.email}`}
                      className="text-accent-red hover:text-red-400 transition-colors break-all"
                    >
                      {contactInfo.email}
                    </a>
                    <p className="text-zinc-400 text-sm mt-2">Direct email for inquiries and feedback</p>
                  </div>
                </div>
              </div>
            )}

            {/* GitHub */}
            {contactInfo.github && (
              <div className="group">
                <a
                  href={contactInfo.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-4 p-6 rounded-lg border border-noir-border bg-noir-bg hover:bg-noir-bg/80 hover:border-white/20 transition-all"
                >
                  <div className="text-3xl flex-shrink-0">🐙</div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-lg mb-2">GitHub</h3>
                    <p className="text-accent-red hover:text-red-400 transition-colors">
                      Visit our GitHub profile
                      <span className="ml-2 inline-block group-hover:translate-x-1 transition-transform">&rarr;</span>
                    </p>
                    <p className="text-zinc-400 text-sm mt-2">Open source code, issues, and contributions</p>
                  </div>
                </a>
              </div>
            )}

            {/* Twitter */}
            {contactInfo.twitter && (
              <div className="group">
                <a
                  href={contactInfo.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-4 p-6 rounded-lg border border-noir-border bg-noir-bg hover:bg-noir-bg/80 hover:border-white/20 transition-all"
                >
                  <div className="text-3xl flex-shrink-0">𝕏</div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-lg mb-2">X (Twitter)</h3>
                    <p className="text-accent-red hover:text-red-400 transition-colors">
                      Follow our updates
                      <span className="ml-2 inline-block group-hover:translate-x-1 transition-transform">&rarr;</span>
                    </p>
                    <p className="text-zinc-400 text-sm mt-2">News, updates, and community highlights</p>
                  </div>
                </a>
              </div>
            )}

            {/* Discord */}
            {contactInfo.discord && (
              <div className="group">
                <a
                  href={contactInfo.discord}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-4 p-6 rounded-lg border border-noir-border bg-noir-bg hover:bg-noir-bg/80 hover:border-white/20 transition-all"
                >
                  <div className="text-3xl flex-shrink-0">💬</div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-lg mb-2">Discord</h3>
                    <p className="text-accent-red hover:text-red-400 transition-colors">
                      Join our community
                      <span className="ml-2 inline-block group-hover:translate-x-1 transition-transform">&rarr;</span>
                    </p>
                    <p className="text-zinc-400 text-sm mt-2">Chat with the community and team</p>
                  </div>
                </a>
              </div>
            )}

            {/* Location */}
            {contactInfo.location && (
              <div>
                <div className="flex items-start gap-4 p-6 rounded-lg border border-noir-border bg-noir-bg">
                  <div className="text-3xl flex-shrink-0">📍</div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-lg mb-2">Location</h3>
                    <p className="text-zinc-300">{contactInfo.location}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Response time info */}
      <section className="py-16 px-6 bg-zinc-950/40">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-zinc-400">
            We typically respond to inquiries within <span className="text-white font-semibold">24-48 hours</span>. Thank you for reaching out!
          </p>
        </div>
      </section>

      <Footer />
    </NoirBackground>
  )
}

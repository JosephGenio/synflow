import NoirBackground from './components/ui/NoirBackground'
import GlassNavbar from './components/ui/GlassNavbar'
import SectionHeading from './components/ui/SectionHeading'
import ToolCollection from './components/ui/ToolCollection'
import Footer from './components/Footer'
import { getToolCollections } from './tools/toolsData'

interface ToolsCollectionScreenProps {
  onHome: () => void
  onLogin?: () => void
  onSignUp?: () => void
  onAbout?: () => void
  onContact?: () => void
  onJsonParser?: () => void
  onBurnerEmail?: () => void
  onPasswordGenerator?: () => void
}

export default function ToolsCollectionScreen({ onHome, onLogin, onSignUp, onAbout, onContact, onJsonParser, onBurnerEmail, onPasswordGenerator }: ToolsCollectionScreenProps): React.ReactElement {
  const collections = getToolCollections({ onJsonParser, onBurnerEmail, onPasswordGenerator })

  return (
    <NoirBackground>
      <GlassNavbar
        onLogin={onLogin}
        onSignUp={onSignUp}
        onBrandClick={onHome}
        links={[
          ...(onAbout ? [{ label: 'About', onClick: onAbout }] : []),
          ...(onContact ? [{ label: 'Contact', onClick: onContact }] : []),
        ]}
      />

      <section className="pt-40 pb-32 px-6">
        <div className="max-w-7xl mx-auto">
          <SectionHeading
            title="All Tools,"
            accent="One Place"
            subtitle="Browse the full collection of developer tools — grouped by what they do."
          />

          {collections.map((collection) => (
            <ToolCollection
              key={collection.label}
              label={collection.label}
              description={collection.description}
              tools={collection.tools}
            />
          ))}
        </div>
      </section>

      <Footer />
    </NoirBackground>
  )
}

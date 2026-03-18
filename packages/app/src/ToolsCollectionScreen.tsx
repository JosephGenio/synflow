import NoirBackground from './components/ui/NoirBackground'
import GlassNavbar from './components/ui/GlassNavbar'
import SectionHeading from './components/ui/SectionHeading'
import ToolCollection from './components/ui/ToolCollection'
import Footer from './components/Footer'
import { getToolCollections } from './tools/toolsData'

interface ToolsCollectionScreenProps {
  onHome: () => void
  onJsonParser?: () => void
  onBurnerEmail?: () => void
}

export default function ToolsCollectionScreen({ onHome, onJsonParser, onBurnerEmail }: ToolsCollectionScreenProps): React.ReactElement {
  const collections = getToolCollections({ onJsonParser, onBurnerEmail })

  return (
    <NoirBackground>
      <GlassNavbar
        onBrandClick={onHome}
        links={[
          { label: 'About', onClick: () => {} },
          { label: 'Contact', onClick: () => {} },
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

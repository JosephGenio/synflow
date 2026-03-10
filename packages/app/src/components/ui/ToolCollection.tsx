import FeatureCard from './FeatureCard'

interface ToolItem {
  icon: React.ReactNode
  title: string
  description: string
  accentColor?: string
  onClick?: () => void
  comingSoon?: boolean
}

interface ToolCollectionProps {
  id?: string
  label: string
  description?: string
  tools: ToolItem[]
}

export default function ToolCollection({ id, label, description, tools }: ToolCollectionProps): React.ReactElement {
  return (
    <div id={id} className="mb-16 last:mb-0">
      {/* Collection header */}
      <div className="flex items-center gap-4 mb-3">
        <h3 className="text-sm font-bold uppercase tracking-widest text-accent-red font-manrope">
          {label}
        </h3>
        <div className="flex-1 h-px bg-zinc-800" />
        <span className="text-xs text-zinc-600 font-mono">
          {tools.filter((t) => !t.comingSoon).length} available
        </span>
      </div>
      {description && (
        <p className="text-sm text-zinc-500 mb-6">{description}</p>
      )}

      {/* Tool cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool) => (
          <div key={tool.title} className="relative">
            <FeatureCard
              icon={tool.icon}
              title={tool.title}
              description={tool.description}
              accentColor={tool.accentColor}
              onClick={tool.comingSoon ? undefined : tool.onClick}
            />
            {tool.comingSoon && (
              <div className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-full">
                Soon
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

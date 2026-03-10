interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  accentColor?: string
  onClick?: () => void
  large?: boolean
}

export default function FeatureCard({
  icon,
  title,
  description,
  accentColor = 'var(--color-accent-red)',
  onClick,
  large = false,
}: FeatureCardProps): React.ReactElement {
  const Wrapper = onClick ? 'button' : 'div'

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`group relative overflow-hidden p-8 border border-noir-border bg-noir-surface hover:border-white/20 transition-all rounded-xl text-left ${
        large ? 'lg:col-span-2 lg:row-span-2' : ''
      } ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="relative z-10 h-full flex flex-col">
        <div
          className="mb-6 inline-flex w-fit p-3 rounded-lg bg-white/5 border border-noir-border"
          style={{ color: accentColor }}
        >
          {icon}
        </div>
        <h3 className={`font-semibold text-white font-manrope mb-3 tracking-tight ${large ? 'text-3xl' : 'text-xl'}`}>
          {title}
        </h3>
        <p className={`text-zinc-400 leading-relaxed ${large ? 'text-lg' : 'text-sm'}`}>
          {description}
        </p>
        {onClick && (
          <div className="mt-auto pt-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
            <span className="text-xs font-mono" style={{ color: accentColor }}>EXPLORE</span>
            <span style={{ color: accentColor }}>&rarr;</span>
          </div>
        )}
      </div>
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none"
        style={{ background: `radial-gradient(circle at top right, ${accentColor}, transparent 70%)` }}
      />
    </Wrapper>
  )
}

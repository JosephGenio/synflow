interface SectionHeadingProps {
  title: string
  accent?: string
  subtitle?: string
}

export default function SectionHeading({ title, accent, subtitle }: SectionHeadingProps): React.ReactElement {
  return (
    <div className="mb-20 text-center max-w-3xl mx-auto animate-fade-up">
      <h2 className="text-4xl md:text-5xl font-semibold text-white tracking-tight font-manrope mb-6">
        {title}{' '}
        {accent && <span className="text-accent-red">{accent}</span>}
      </h2>
      {subtitle && (
        <p className="text-lg text-zinc-400 font-light">{subtitle}</p>
      )}
    </div>
  )
}

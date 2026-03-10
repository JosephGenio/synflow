interface ShinyButtonProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}

export default function ShinyButton({ children, onClick, className = '' }: ShinyButtonProps): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shiny-cta group ${className}`}
    >
      <span className="relative z-10 flex items-center gap-2 text-white font-medium">
        {children}
      </span>
    </button>
  )
}

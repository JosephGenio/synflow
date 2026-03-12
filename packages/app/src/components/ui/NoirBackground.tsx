interface NoirBackgroundProps {
  children: React.ReactNode
}

export default function NoirBackground({ children }: NoirBackgroundProps): React.ReactElement {
  return (
    <div className="min-h-screen bg-noir-bg text-white font-inter relative overflow-x-hidden selection-red">
      {/* Fixed star field + gradient backdrop */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-noir-surface-dark to-black" />
        <div className="absolute top-0 left-0 w-[1px] h-[1px] bg-transparent stars-1 animate-star-slow" />
        <div className="absolute top-0 left-0 w-[2px] h-[2px] bg-transparent stars-2 animate-star-fast" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-600/5 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(var(--color-noir-grid)_1px,transparent_1px),linear-gradient(90deg,var(--color-noir-grid)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(circle_at_center,black_40%,transparent_80%)]" />
      </div>

      {/* Top gradient blur */}
      <div className="gradient-blur" />

      {/* Page content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}

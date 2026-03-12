interface NavLink {
  label: string
  onClick: () => void
}

interface GlassNavbarProps {
  brandName?: string
  links?: NavLink[]
  onLogin?: () => void
  onSignUp?: () => void
  onBrandClick?: () => void
}

export default function GlassNavbar({
  brandName = 'Synflo',
  links = [],
  onLogin,
  onSignUp,
  onBrandClick,
}: GlassNavbarProps): React.ReactElement {
  return (
    <header className="fixed top-0 left-0 w-full z-50 pt-6 px-4">
      <nav className="max-w-5xl mx-auto flex items-center justify-between bg-black/60 backdrop-blur-xl border border-noir-border rounded-full px-6 py-3 shadow-2xl">
        {/* Brand */}
        <button
          type="button"
          onClick={onBrandClick}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="w-5 h-5 bg-accent-red rounded-sm rotate-45" />
          <span className="text-lg font-bold font-manrope tracking-tight">{brandName}</span>
        </button>

        {/* Nav links */}
        {links.length > 0 && (
          <div className="hidden md:flex items-center gap-8">
            {links.map((link) => (
              <button
                key={link.label}
                type="button"
                onClick={link.onClick}
                className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
              >
                {link.label}
              </button>
            ))}
          </div>
        )}

        {/* Auth actions */}
        <div className="flex items-center gap-4">
          {onLogin && (
            <button
              type="button"
              onClick={onLogin}
              className="hidden md:block text-sm font-medium text-zinc-300 hover:text-white transition-colors"
            >
              Log In
            </button>
          )}
          {onSignUp && (
            <button
              type="button"
              onClick={onSignUp}
              className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-white/5 px-6 py-2 transition-transform active:scale-95"
            >
              <span className="absolute inset-0 border border-noir-border rounded-full" />
              <span className="absolute inset-[-100%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_75%,var(--color-accent-red)_100%)] opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="absolute inset-[1px] rounded-full bg-black" />
              <span className="relative z-10 flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                Get Started
              </span>
            </button>
          )}
        </div>
      </nav>
    </header>
  )
}

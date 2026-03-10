export default function Footer(): React.ReactElement {
  return (
    <footer className="bg-black border-t border-zinc-900 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-accent-red rounded-sm rotate-45" />
            <span className="text-lg font-bold font-manrope tracking-tight text-white">Synflo</span>
          </div>
          <p className="text-zinc-500 text-sm max-w-md text-center md:text-right">
            A growing collection of developer tools, built for speed and simplicity.
          </p>
        </div>

        <div className="border-t border-zinc-900 pt-6 flex flex-col md:flex-row items-center justify-between text-zinc-600 text-[10px] uppercase tracking-widest">
          <span>&copy; {new Date().getFullYear()} Synflo. All rights reserved.</span>
          <span className="mt-2 md:mt-0">v0.1.0</span>
        </div>
      </div>
    </footer>
  )
}

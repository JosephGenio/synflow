import { useState, useEffect, useRef } from 'react'
import type { SearchMatch } from './types'

interface JsonSearchProps {
  matches: SearchMatch[]
  query: string
  onQueryChange: (query: string) => void
  onSelectMatch: (path: string, key: string, value: string, matchType: 'key' | 'value') => void
  debounceMs?: number
}

export default function JsonSearch({ matches, query, onQueryChange, onSelectMatch, debounceMs = 200 }: JsonSearchProps): React.ReactElement {
  const [localQuery, setLocalQuery] = useState(query)
  const [expanded, setExpanded] = useState(!!query)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      onQueryChange(localQuery)
    }, debounceMs)
    return () => clearTimeout(timer)
  }, [localQuery, onQueryChange, debounceMs])

  function handleExpand(): void {
    setExpanded(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function handleClear(): void {
    setLocalQuery('')
    onQueryChange('')
    inputRef.current?.focus()
  }

  function handleCollapse(): void {
    if (!localQuery) {
      setExpanded(false)
    }
  }

  return (
    <div className="bg-noir-surface rounded-xl border border-noir-border">
      {!expanded ? (
        <button
          type="button"
          onClick={handleExpand}
          className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-zinc-400 hover:bg-white/5 rounded-xl transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <span>Search</span>
        </button>
      ) : (
        <div className="p-3">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              onBlur={handleCollapse}
              placeholder="Search keys or values..."
              className="w-full pl-9 pr-8 py-2 rounded-lg border border-noir-border text-sm text-white placeholder-zinc-600 bg-black focus:outline-none focus:ring-2 focus:ring-accent-red focus:border-transparent transition-colors"
            />
            {localQuery && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleClear}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                aria-label="Clear search"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {query && (
            <div className="mt-2 text-xs text-zinc-500">
              {matches.length} match{matches.length !== 1 ? 'es' : ''}
            </div>
          )}

          {matches.length > 0 && (
            <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
              {matches.map((match, i) => (
                <button
                  key={`${match.path}-${match.type}-${i}`}
                  type="button"
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                  onClick={() => onSelectMatch(match.path, match.key, match.value, match.type)}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${
                      match.type === 'key'
                        ? 'bg-accent-red/20 text-red-400'
                        : 'bg-green-900/30 text-green-400'
                    }`}>
                      {match.type}
                    </span>
                    <span className="font-mono text-xs text-zinc-500 truncate">{match.path}</span>
                  </div>
                  <div className="font-mono text-xs text-zinc-300 truncate mt-0.5 pl-1">
                    {match.value}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

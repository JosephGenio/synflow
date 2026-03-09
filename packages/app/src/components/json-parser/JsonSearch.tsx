import { useState, useEffect, useRef } from 'react'
import type { SearchMatch } from './types'

interface JsonSearchProps {
  matches: SearchMatch[]
  query: string
  onQueryChange: (query: string) => void
  onSelectMatch: (path: string, key: string, value: string, matchType: 'key' | 'value') => void
}

export default function JsonSearch({ matches, query, onQueryChange, onSelectMatch }: JsonSearchProps): React.ReactElement {
  const [localQuery, setLocalQuery] = useState(query)
  const [expanded, setExpanded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      onQueryChange(localQuery)
    }, 200)
    return () => clearTimeout(timer)
  }, [localQuery, onQueryChange])

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
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      {!expanded ? (
        <button
          type="button"
          onClick={handleExpand}
          className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors"
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
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
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
              className="w-full pl-9 pr-8 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
            />
            {localQuery && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleClear}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {matches.length} match{matches.length !== 1 ? 'es' : ''}
            </div>
          )}

          {matches.length > 0 && (
            <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
              {matches.map((match, i) => (
                <button
                  key={`${match.path}-${match.type}-${i}`}
                  type="button"
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  onClick={() => onSelectMatch(match.path, match.key, match.value, match.type)}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${
                      match.type === 'key'
                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                        : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    }`}>
                      {match.type}
                    </span>
                    <span className="font-mono text-xs text-gray-500 dark:text-gray-400 truncate">{match.path}</span>
                  </div>
                  <div className="font-mono text-xs text-gray-700 dark:text-gray-300 truncate mt-0.5 pl-1">
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

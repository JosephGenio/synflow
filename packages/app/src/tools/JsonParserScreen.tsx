import { useState, useMemo, useCallback, useRef } from 'react'
import { useTheme } from '../ThemeContext'
import type { OutputTab } from '../components/json-parser/types'
import { parseJson, buildTree, computeStats, searchJson, formatJson, minifyJson, buildPathLineMap, findKeyInInput } from '../components/json-parser/utils'
import JsonTreeView from '../components/json-parser/JsonTreeView'
import JsonStatsPanel from '../components/json-parser/JsonStats'
import JsonSearch from '../components/json-parser/JsonSearch'
import SyntaxHighlight from '../components/json-parser/SyntaxHighlight'
import Footer from '../components/Footer'

interface JsonParserScreenProps {
  onHome: () => void
}

const tabs: { key: OutputTab; label: string }[] = [
  { key: 'tree', label: 'Tree' },
  { key: 'formatted', label: 'Formatted' },
  { key: 'minified', label: 'Minified' },
]

export default function JsonParserScreen({ onHome }: JsonParserScreenProps): React.ReactElement {
  const { isDark, toggleTheme } = useTheme()
  const [input, setInput] = useState('')
  const [activeTab, setActiveTab] = useState<OutputTab>('tree')
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [highlightLine, setHighlightLine] = useState<number | undefined>(undefined)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const validationResult = useMemo(() => parseJson(input), [input])

  const tree = useMemo(() => {
    if (!validationResult.valid || validationResult.data === undefined) return null
    return buildTree(validationResult.data, 'root', '$', 0)
  }, [validationResult])

  const stats = useMemo(() => {
    if (!tree) return null
    return computeStats(input, tree)
  }, [input, tree])

  const searchMatches = useMemo(() => {
    if (!tree || !searchQuery.trim()) return []
    return searchJson(tree, searchQuery)
  }, [tree, searchQuery])

  const formatted = useMemo(() => {
    if (!validationResult.valid) return ''
    return formatJson(validationResult.data)
  }, [validationResult])

  const minified = useMemo(() => {
    if (!validationResult.valid) return ''
    return minifyJson(validationResult.data)
  }, [validationResult])

  const pathLineMap = useMemo(() => {
    if (!validationResult.valid || validationResult.data === undefined) return new Map<string, number>()
    return buildPathLineMap(validationResult.data)
  }, [validationResult])

  const handleCopy = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopyFeedback(label)
      setTimeout(() => setCopyFeedback(null), 2000)
    })
  }, [])

  const handleSearchQueryChange = useCallback((q: string) => {
    setSearchQuery(q)
  }, [])

  const handlePaste = useCallback(() => {
    navigator.clipboard.readText().then((text) => {
      setInput(text)
    })
  }, [])

  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null)
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      setFileError('Only .json files are allowed.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError(`File too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum is 5 MB.`)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = evt.target?.result
      if (typeof text === 'string') {
        setInput(text)
        setSelectedPath(null)
        setSearchQuery('')
      }
    }
    reader.onerror = () => {
      setFileError('Failed to read file.')
    }
    reader.readAsText(file)

    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const handleSelectMatch = useCallback((path: string, key: string, value: string, matchType: 'key' | 'value') => {
    setSelectedPath(path)
    setActiveTab('formatted')

    const line = pathLineMap.get(path)
    setHighlightLine(line)

    const pos = findKeyInInput(input, key, value, matchType)
    if (pos && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(pos.start, pos.end)
      const linesBefore = input.slice(0, pos.start).split('\n').length - 1
      const lineHeight = 20
      textareaRef.current.scrollTop = Math.max(0, linesBefore * lineHeight - textareaRef.current.clientHeight / 2)
      setTimeout(() => {
        textareaRef.current?.blur()
      }, 600)
    }
  }, [pathLineMap, input])

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 transition-colors flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onHome}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
              aria-label="Back to home"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">JSON Parser</h1>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            aria-label="Toggle theme"
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-4 p-4 lg:p-6 max-w-screen-2xl mx-auto flex-1 min-h-0 w-full">
        {/* Left: Input Panel */}
        <div className="w-full lg:w-1/2 flex flex-col min-h-0">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden flex-1 min-h-0">
            {/* Input Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Input</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Upload
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={handlePaste}
                  className="text-xs px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Paste
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInput('')
                    setSelectedPath(null)
                    setSearchQuery('')
                    setFileError(null)
                    setHighlightLine(undefined)
                  }}
                  className="text-xs px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* File Upload Error */}
            {fileError && (
              <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 flex-shrink-0">
                <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4" />
                  <path d="M12 16h.01" />
                </svg>
                <span className="text-xs text-red-700 dark:text-red-400">{fileError}</span>
                <button
                  type="button"
                  onClick={() => setFileError(null)}
                  className="ml-auto text-red-400 hover:text-red-600 dark:hover:text-red-300"
                  aria-label="Dismiss error"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18" />
                    <path d="M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='Paste or type JSON here...'
              className="w-full flex-1 min-h-0 p-4 font-mono text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none resize-none placeholder-gray-400 dark:placeholder-gray-500"
              spellCheck={false}
            />

            {/* Validation Status */}
            {input.trim() && (
              <div className={`flex items-center gap-2 px-4 py-2 border-t flex-shrink-0 ${
                validationResult.valid
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}>
                {validationResult.valid ? (
                  <>
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    <span className="text-xs font-medium text-green-700 dark:text-green-400">Valid JSON</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M15 9l-6 6" />
                      <path d="M9 9l6 6" />
                    </svg>
                    <span className="text-xs text-red-700 dark:text-red-400">
                      <span className="font-medium">Invalid JSON</span>
                      {validationResult.error && (
                        <span>
                          {' — '}{validationResult.error.message}
                          {validationResult.error.line !== undefined && (
                            <span className="font-mono"> (line {validationResult.error.line}, col {validationResult.error.column})</span>
                          )}
                        </span>
                      )}
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Stats — inside card, collapsible */}
            {stats && (
              <div className="border-t border-gray-200 dark:border-gray-700 flex-shrink-0 max-h-48 overflow-y-auto">
                <JsonStatsPanel stats={stats} />
              </div>
            )}
          </div>
        </div>

        {/* Right: Output Panel */}
        <div className="w-full lg:w-1/2 flex flex-col gap-3 min-h-0">
          {/* Search — top of right panel */}
          {tree && (
            <div className="flex-shrink-0">
              <JsonSearch
                matches={searchMatches}
                query={searchQuery}
                onQueryChange={handleSearchQueryChange}
                onSelectMatch={handleSelectMatch}
              />
            </div>
          )}

          {/* Output Card — fills remaining height */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden flex-1 min-h-0">
            {/* Tab Bar */}
            <div className="flex items-center gap-1 px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Selected Path */}
            {selectedPath && (
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <span className="text-xs text-gray-500 dark:text-gray-400">Path:</span>
                <code className="text-xs font-mono text-indigo-600 dark:text-indigo-400 truncate">{selectedPath}</code>
                <button
                  type="button"
                  onClick={() => handleCopy(selectedPath, 'Path')}
                  className="text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors flex-shrink-0"
                >
                  Copy
                </button>
              </div>
            )}

            {/* Tab Content — scrollable */}
            <div className="flex-1 overflow-auto p-4 min-h-0">
              {!validationResult.valid ? (
                <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500 text-sm">
                  {input.trim() ? 'Fix JSON errors to see output' : 'Paste JSON to get started'}
                </div>
              ) : activeTab === 'tree' && tree ? (
                <JsonTreeView
                  node={tree}
                  searchQuery={searchQuery}
                  onSelectPath={setSelectedPath}
                />
              ) : activeTab === 'formatted' ? (
                <SyntaxHighlight json={formatted} highlightLine={highlightLine} />
              ) : activeTab === 'minified' ? (
                <pre className="font-mono text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-all">
                  {minified}
                </pre>
              ) : null}
            </div>

            {/* Copy Footer */}
            {validationResult.valid && (
              <div className="flex items-center gap-2 px-4 py-2.5 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopy(formatted, 'Formatted')}
                  className="text-xs px-3 py-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                >
                  {copyFeedback === 'Formatted' ? 'Copied!' : 'Copy Formatted'}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(minified, 'Minified')}
                  className="text-xs px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {copyFeedback === 'Minified' ? 'Copied!' : 'Copy Minified'}
                </button>
                {selectedPath && (
                  <button
                    type="button"
                    onClick={() => handleCopy(selectedPath, 'Path')}
                    className="text-xs px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    {copyFeedback === 'Path' ? 'Copied!' : 'Copy Path'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}

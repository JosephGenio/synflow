import { useState, useMemo, useCallback, useRef, useEffect, useDeferredValue } from 'react'
import type { OutputTab } from '../components/json-parser/types'
import { parseJson, buildTree, computeStats, searchJson, formatJson, minifyJson, buildPathLineMap, findKeyInInput, LARGE_INPUT_THRESHOLD } from '../components/json-parser/utils'
import { useDebouncedValue } from '../components/json-parser/useDebouncedValue'
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
  const [input, setInput] = useState('')
  const [activeTab, setActiveTab] = useState<OutputTab>('tree')
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [highlightLine, setHighlightLine] = useState<number | undefined>(undefined)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const isLargeInput = input.length > LARGE_INPUT_THRESHOLD
  const debouncedInput = useDebouncedValue(input, isLargeInput ? 300 : 0)
  const isProcessing = isLargeInput && input !== debouncedInput

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen])

  const validationResult = useMemo(() => parseJson(debouncedInput), [debouncedInput])

  const tree = useMemo(() => {
    if (!validationResult.valid || validationResult.data === undefined) return null
    return buildTree(validationResult.data, 'root', '$', 0)
  }, [validationResult])

  const stats = useMemo(() => {
    if (!tree) return null
    return computeStats(debouncedInput, tree)
  }, [debouncedInput, tree])

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

  const pathLineMapRef = useRef<{ data: unknown; map: Map<string, number> }>({ data: undefined, map: new Map() })

  const getPathLineMap = useCallback((): Map<string, number> => {
    if (!validationResult.valid || validationResult.data === undefined) return new Map()
    if (pathLineMapRef.current.data === validationResult.data) return pathLineMapRef.current.map
    const map = buildPathLineMap(validationResult.data)
    pathLineMapRef.current = { data: validationResult.data, map }
    return map
  }, [validationResult])

  const deferredTree = useDeferredValue(tree)
  const deferredStats = useDeferredValue(stats)
  const deferredSearchMatches = useDeferredValue(searchMatches)

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

    const line = getPathLineMap().get(path)
    setHighlightLine(line)

    const pos = findKeyInInput(debouncedInput, key, value, matchType)
    if (pos && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(pos.start, pos.end)
      const linesBefore = debouncedInput.slice(0, pos.start).split('\n').length - 1
      const lineHeight = 20
      textareaRef.current.scrollTop = Math.max(0, linesBefore * lineHeight - textareaRef.current.clientHeight / 2)
      setTimeout(() => {
        textareaRef.current?.blur()
      }, 600)
    }
  }, [getPathLineMap, debouncedInput])

  const actionBtnClass = 'text-xs px-2.5 py-1 rounded-md bg-white/5 border border-noir-border text-zinc-300 hover:bg-white/10 hover:text-white transition-colors'

  return (
    <div className="bg-black text-white font-inter flex flex-col selection-red">
      {/* Tool area — fills exactly one viewport */}
      <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-noir-border bg-black/60 backdrop-blur-xl px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onHome}
              className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
              aria-label="Back to home"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-accent-red rounded-sm rotate-45" />
              <h1 className="text-lg font-semibold font-manrope tracking-tight">JSON Parser</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-4 p-4 lg:p-6 max-w-screen-2xl mx-auto flex-1 min-h-0 w-full">
        {/* Left: Input Panel */}
        <div className="w-full lg:w-1/2 flex flex-col min-h-0">
          <div className="bg-noir-surface rounded-xl border border-noir-border flex flex-col overflow-hidden flex-1 min-h-0">
            {/* Input Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-noir-border flex-shrink-0">
              <span className="text-sm font-medium text-zinc-300">Input</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={actionBtnClass}
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
                  className={actionBtnClass}
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
                  className={actionBtnClass}
                >
                  Clear
                </button>
              </div>
            </div>

            {/* File Upload Error */}
            {fileError && (
              <div className="flex items-center gap-2 px-4 py-2 bg-red-900/20 border-b border-red-800 flex-shrink-0">
                <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4" />
                  <path d="M12 16h.01" />
                </svg>
                <span className="text-xs text-red-400">{fileError}</span>
                <button
                  type="button"
                  onClick={() => setFileError(null)}
                  className="ml-auto text-red-400 hover:text-red-300"
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
              className="w-full flex-1 min-h-0 p-4 font-mono text-sm text-white bg-noir-surface focus:outline-none resize-none placeholder-zinc-600"
              spellCheck={false}
            />

            {/* Validation Status */}
            {input.trim() && (
              <div className={`flex items-center gap-2 px-4 py-2 border-t flex-shrink-0 ${
                validationResult.valid
                  ? 'bg-green-900/20 border-green-800'
                  : 'bg-red-900/20 border-red-800'
              }`}>
                {validationResult.valid ? (
                  <>
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    <span className="text-xs font-medium text-green-400">Valid JSON</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M15 9l-6 6" />
                      <path d="M9 9l6 6" />
                    </svg>
                    <span className="text-xs text-red-400">
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

            {/* Processing indicator for large inputs */}
            {isProcessing && (
              <div className="flex items-center gap-2 px-4 py-2 border-t border-noir-border flex-shrink-0">
                <div className="w-3 h-3 border-2 border-zinc-500 border-t-accent-red rounded-full animate-spin" />
                <span className="text-xs text-zinc-500">Processing...</span>
              </div>
            )}

            {/* Stats */}
            {deferredStats && (
              <div className="border-t border-noir-border flex-shrink-0 max-h-48 overflow-y-auto">
                <JsonStatsPanel stats={deferredStats} />
              </div>
            )}
          </div>
        </div>

        {/* Right: Output Panel */}
        <div className={`flex flex-col gap-3 min-h-0 ${isFullscreen ? 'hidden' : 'w-full lg:w-1/2'}`}>
          {/* Search */}
          {deferredTree && (
            <div className="flex-shrink-0">
              <JsonSearch
                matches={deferredSearchMatches}
                query={searchQuery}
                onQueryChange={handleSearchQueryChange}
                onSelectMatch={handleSelectMatch}
                debounceMs={isLargeInput ? 500 : 200}
              />
            </div>
          )}

          {/* Output Card */}
          <div className="bg-noir-surface rounded-xl border border-noir-border flex flex-col overflow-hidden flex-1 min-h-0">
            {/* Tab Bar */}
            <div className="flex items-center gap-1 px-4 py-2.5 border-b border-noir-border flex-shrink-0">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'bg-accent-red text-white'
                      : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setIsFullscreen(true)}
                className="ml-auto p-1.5 rounded-md text-zinc-500 hover:bg-white/5 hover:text-white transition-colors"
                aria-label="Fullscreen output"
                title="Fullscreen"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3" />
                  <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
                  <path d="M3 16v3a2 2 0 0 0 2 2h3" />
                  <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
                </svg>
              </button>
            </div>

            {/* Selected Path */}
            {selectedPath && (
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border-b border-noir-border flex-shrink-0">
                <span className="text-xs text-zinc-500">Path:</span>
                <code className="text-xs font-mono text-accent-red truncate">{selectedPath}</code>
                <button
                  type="button"
                  onClick={() => handleCopy(selectedPath, 'Path')}
                  className="text-xs px-2 py-0.5 rounded bg-white/5 border border-noir-border text-zinc-300 hover:bg-white/10 transition-colors flex-shrink-0"
                >
                  Copy
                </button>
              </div>
            )}

            {/* Tab Content */}
            <div className="flex-1 overflow-auto p-4 min-h-0">
              {!validationResult.valid ? (
                <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
                  {input.trim() ? 'Fix JSON errors to see output' : 'Paste JSON to get started'}
                </div>
              ) : activeTab === 'tree' && deferredTree ? (
                <JsonTreeView
                  node={deferredTree}
                  searchQuery={searchQuery}
                  onSelectPath={setSelectedPath}
                />
              ) : activeTab === 'formatted' ? (
                <SyntaxHighlight json={formatted} highlightLine={highlightLine} maxLines={isLargeInput ? 500 : undefined} />
              ) : activeTab === 'minified' ? (
                <pre className="font-mono text-sm text-zinc-200 whitespace-pre-wrap break-all">
                  {minified}
                </pre>
              ) : null}
            </div>

            {/* Copy Footer */}
            {validationResult.valid && (
              <div className="flex items-center gap-2 px-4 py-2.5 border-t border-noir-border flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopy(formatted, 'Formatted')}
                  className="text-xs px-3 py-1.5 rounded-md bg-accent-red text-white hover:bg-red-700 transition-colors"
                >
                  {copyFeedback === 'Formatted' ? 'Copied!' : 'Copy Formatted'}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(minified, 'Minified')}
                  className="text-xs px-3 py-1.5 rounded-md border border-noir-border text-zinc-300 hover:bg-white/5 transition-colors"
                >
                  {copyFeedback === 'Minified' ? 'Copied!' : 'Copy Minified'}
                </button>
                {selectedPath && (
                  <button
                    type="button"
                    onClick={() => handleCopy(selectedPath, 'Path')}
                    className="text-xs px-3 py-1.5 rounded-md border border-noir-border text-zinc-300 hover:bg-white/5 transition-colors"
                  >
                    {copyFeedback === 'Path' ? 'Copied!' : 'Copy Path'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      </div>

      {/* Fullscreen Output Popup */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6" onClick={() => setIsFullscreen(false)}>
          <div className="w-full max-w-6xl h-[90vh] bg-noir-surface border border-noir-border rounded-2xl shadow-2xl shadow-accent-red/5 flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Popup Header */}
            <div className="flex items-center gap-1 px-5 py-3 border-b border-noir-border flex-shrink-0">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'bg-accent-red text-white'
                      : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}

              <div className="ml-auto flex items-center gap-2">
                {validationResult.valid && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleCopy(formatted, 'Formatted')}
                      className="text-xs px-3 py-1.5 rounded-md bg-accent-red text-white hover:bg-red-700 transition-colors"
                    >
                      {copyFeedback === 'Formatted' ? 'Copied!' : 'Copy Formatted'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(minified, 'Minified')}
                      className="text-xs px-3 py-1.5 rounded-md border border-noir-border text-zinc-300 hover:bg-white/5 transition-colors"
                    >
                      {copyFeedback === 'Minified' ? 'Copied!' : 'Copy Minified'}
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setIsFullscreen(false)}
                  className="p-1.5 rounded-md text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
                  aria-label="Exit fullscreen"
                  title="Exit fullscreen (Esc)"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Search — own row, outside header flex */}
            {deferredTree && (
              <div className="px-5 py-2 border-b border-noir-border flex-shrink-0">
                <JsonSearch
                  matches={deferredSearchMatches}
                  query={searchQuery}
                  onQueryChange={handleSearchQueryChange}
                  onSelectMatch={handleSelectMatch}
                  debounceMs={isLargeInput ? 500 : 200}
                />
              </div>
            )}

            {/* Selected Path */}
            {selectedPath && (
              <div className="flex items-center gap-2 px-5 py-2 bg-white/5 border-b border-noir-border flex-shrink-0">
                <span className="text-xs text-zinc-500">Path:</span>
                <code className="text-xs font-mono text-accent-red truncate">{selectedPath}</code>
                <button
                  type="button"
                  onClick={() => handleCopy(selectedPath, 'Path')}
                  className="text-xs px-2 py-0.5 rounded bg-white/5 border border-noir-border text-zinc-300 hover:bg-white/10 transition-colors flex-shrink-0"
                >
                  {copyFeedback === 'Path' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            )}

            {/* Popup Content */}
            <div className="flex-1 overflow-auto p-5 min-h-0">
              {!validationResult.valid ? (
                <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
                  {input.trim() ? 'Fix JSON errors to see output' : 'Paste JSON to get started'}
                </div>
              ) : activeTab === 'tree' && deferredTree ? (
                <JsonTreeView
                  node={deferredTree}
                  searchQuery={searchQuery}
                  onSelectPath={setSelectedPath}
                />
              ) : activeTab === 'formatted' ? (
                <SyntaxHighlight json={formatted} highlightLine={highlightLine} maxLines={isLargeInput ? 500 : undefined} />
              ) : activeTab === 'minified' ? (
                <pre className="font-mono text-sm text-zinc-200 whitespace-pre-wrap break-all">
                  {minified}
                </pre>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Footer — visible only when scrolling past the fold */}
      <Footer />
    </div>
  )
}

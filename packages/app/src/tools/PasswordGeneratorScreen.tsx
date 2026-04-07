import Footer from '../components/Footer'
import { usePasswordGenerator } from './passwordGenerator/usePasswordGenerator'
import type { StrengthLevel } from './passwordGenerator/engine'

interface PasswordGeneratorScreenProps {
  onHome: () => void
}

/* ── Strength colors ── */

const STRENGTH_COLORS: Record<StrengthLevel, string> = {
  'weak': '#ef4444',
  'fair': '#f59e0b',
  'good': '#3b82f6',
  'strong': '#22c55e',
  'very-strong': '#10b981',
}

const STRENGTH_LABELS: Record<StrengthLevel, string> = {
  'weak': 'Weak',
  'fair': 'Fair',
  'good': 'Good',
  'strong': 'Strong',
  'very-strong': 'Very Strong',
}

const STRENGTH_SEGMENTS: Record<StrengthLevel, number> = {
  'weak': 1,
  'fair': 2,
  'good': 3,
  'strong': 4,
  'very-strong': 5,
}

const SEPARATORS = [
  { label: '-', value: '-' },
  { label: '.', value: '.' },
  { label: '_', value: '_' },
  { label: '⎵', value: ' ' },
]

export default function PasswordGeneratorScreen({ onHome }: PasswordGeneratorScreenProps): React.ReactElement {
  const {
    password,
    config,
    activePresetId,
    strength,
    copyFeedback,
    presets,
    regenerate,
    applyPreset,
    updateCharacterOptions,
    updatePassphraseOptions,
    setMode,
    copyToClipboard,
  } = usePasswordGenerator()

  const charOpts = config.characters
  const phraseOpts = config.passphrase

  // Prevent disabling the last active character type
  const activeTypeCount = [charOpts.uppercase, charOpts.lowercase, charOpts.numbers, charOpts.symbols].filter(Boolean).length

  return (
    <div className="bg-black text-white font-inter flex flex-col selection-red">
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
                <div className="w-4 h-4 bg-accent-green rounded-sm rotate-45" />
                <h1 className="text-lg font-semibold font-manrope tracking-tight">Password Generator</h1>
              </div>
            </div>
          </div>
        </header>

        {/* Main scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-2xl mx-auto flex flex-col gap-5">

            {/* ── Section 1: Password Display ── */}
            <div className="bg-noir-surface rounded-xl border border-noir-border p-5">
              <div
                className="font-mono text-xl lg:text-2xl text-center break-all px-2 py-6 rounded-lg bg-white/[0.02] border border-white/[0.05] select-all"
                style={{ minHeight: '4rem' }}
              >
                {password || <span className="text-zinc-600">—</span>}
              </div>

              <div className="flex items-center justify-center gap-3 mt-4">
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white font-medium text-sm transition-colors"
                >
                  {copyFeedback ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                      Copy
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={regenerate}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-noir-border text-zinc-300 hover:bg-white/10 hover:text-white text-sm transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" /></svg>
                  Regenerate
                </button>
              </div>
            </div>

            {/* ── Section 2: Presets ── */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset.id)}
                  className={`flex-shrink-0 flex flex-col items-start px-4 py-2.5 rounded-lg border text-sm transition-colors ${
                    activePresetId === preset.id
                      ? 'bg-green-500/10 border-green-500/50 text-green-400'
                      : 'bg-white/5 border-noir-border text-zinc-400 hover:bg-white/10 hover:text-zinc-200'
                  }`}
                >
                  <span className="font-medium">{preset.label}</span>
                  <span className="text-[11px] opacity-70">{preset.description}</span>
                </button>
              ))}
            </div>

            {/* ── Section 3: Customization ── */}
            <div className="bg-noir-surface rounded-xl border border-noir-border p-5">
              <h2 className="text-sm font-medium text-zinc-300 mb-4">Customize</h2>

              {/* Mode tabs */}
              <div className="flex gap-1 p-1 bg-white/[0.03] rounded-lg mb-5">
                <button
                  type="button"
                  onClick={() => setMode('characters')}
                  className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    config.mode === 'characters'
                      ? 'bg-green-500/15 text-green-400'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Characters
                </button>
                <button
                  type="button"
                  onClick={() => setMode('passphrase')}
                  className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    config.mode === 'passphrase'
                      ? 'bg-green-500/15 text-green-400'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Passphrase
                </button>
              </div>

              {config.mode === 'characters' ? (
                <div className="flex flex-col gap-5">
                  {/* Length slider */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs text-zinc-400">Length</label>
                      <input
                        type="number"
                        min={4}
                        max={128}
                        value={charOpts.length}
                        onChange={(e) => {
                          const v = Math.max(4, Math.min(128, parseInt(e.target.value) || 4))
                          updateCharacterOptions({ length: v })
                        }}
                        className="w-16 text-right text-sm font-mono bg-transparent border border-noir-border rounded-md px-2 py-1 text-white focus:outline-none focus:border-green-500/50"
                      />
                    </div>
                    <input
                      type="range"
                      min={4}
                      max={128}
                      value={charOpts.length}
                      onChange={(e) => updateCharacterOptions({ length: parseInt(e.target.value) })}
                      className="w-full accent-green-500"
                    />
                  </div>

                  {/* Character type toggles */}
                  <div>
                    <label className="text-xs text-zinc-400 mb-2 block">Character Types</label>
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        { key: 'uppercase' as const, label: 'Uppercase', hint: 'A–Z' },
                        { key: 'lowercase' as const, label: 'Lowercase', hint: 'a–z' },
                        { key: 'numbers' as const, label: 'Numbers', hint: '0–9' },
                        { key: 'symbols' as const, label: 'Symbols', hint: '!@#$%' },
                      ] as const).map(({ key, label, hint }) => {
                        const isActive = charOpts[key]
                        const isLastActive = isActive && activeTypeCount === 1
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              if (isLastActive) return
                              updateCharacterOptions({ [key]: !isActive })
                            }}
                            disabled={isLastActive}
                            className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-colors ${
                              isActive
                                ? 'bg-green-500/10 border-green-500/40 text-green-400'
                                : 'bg-white/[0.02] border-noir-border text-zinc-500 hover:bg-white/5'
                            } ${isLastActive ? 'opacity-60 cursor-not-allowed' : ''}`}
                          >
                            <span className="font-medium">{label}</span>
                            <span className="text-[11px] opacity-60">{hint}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Exclude ambiguous */}
                  <button
                    type="button"
                    onClick={() => updateCharacterOptions({ excludeAmbiguous: !charOpts.excludeAmbiguous })}
                    className="flex items-center justify-between px-3 py-2 rounded-lg border border-noir-border text-sm transition-colors hover:bg-white/5"
                  >
                    <div>
                      <span className="text-zinc-300">Exclude ambiguous</span>
                      <span className="text-[11px] text-zinc-500 ml-2 font-mono">0 O l 1 I</span>
                    </div>
                    <div className={`w-8 h-[18px] rounded-full transition-colors flex items-center ${charOpts.excludeAmbiguous ? 'bg-green-500 justify-end' : 'bg-zinc-700 justify-start'}`}>
                      <div className="w-3.5 h-3.5 rounded-full bg-white mx-0.5" />
                    </div>
                  </button>

                  {/* Custom exclude */}
                  <div>
                    <label className="text-xs text-zinc-400 mb-1 block">Exclude Characters</label>
                    <input
                      type="text"
                      value={charOpts.customExclude}
                      onChange={(e) => updateCharacterOptions({ customExclude: e.target.value })}
                      placeholder="e.g. {}[]\/"
                      className="w-full text-sm font-mono bg-white/[0.02] border border-noir-border rounded-lg px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-green-500/50"
                    />
                  </div>
                </div>
              ) : (
                /* Passphrase mode */
                <div className="flex flex-col gap-5">
                  {/* Word count */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs text-zinc-400">Word Count</label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (phraseOpts.wordCount > 3) updatePassphraseOptions({ wordCount: phraseOpts.wordCount - 1 })
                          }}
                          disabled={phraseOpts.wordCount <= 3}
                          className="w-7 h-7 rounded-md bg-white/5 border border-noir-border text-zinc-300 hover:bg-white/10 flex items-center justify-center text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          −
                        </button>
                        <span className="font-mono text-sm w-6 text-center">{phraseOpts.wordCount}</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (phraseOpts.wordCount < 10) updatePassphraseOptions({ wordCount: phraseOpts.wordCount + 1 })
                          }}
                          disabled={phraseOpts.wordCount >= 10}
                          className="w-7 h-7 rounded-md bg-white/5 border border-noir-border text-zinc-300 hover:bg-white/10 flex items-center justify-center text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Separator */}
                  <div>
                    <label className="text-xs text-zinc-400 mb-2 block">Separator</label>
                    <div className="flex gap-2">
                      {SEPARATORS.map((sep) => (
                        <button
                          key={sep.value}
                          type="button"
                          onClick={() => updatePassphraseOptions({ separator: sep.value })}
                          className={`w-10 h-10 rounded-lg border text-sm font-mono flex items-center justify-center transition-colors ${
                            phraseOpts.separator === sep.value
                              ? 'bg-green-500/10 border-green-500/40 text-green-400'
                              : 'bg-white/[0.02] border-noir-border text-zinc-400 hover:bg-white/5'
                          }`}
                        >
                          {sep.label}
                        </button>
                      ))}
                      <input
                        type="text"
                        maxLength={3}
                        value={!SEPARATORS.some((s) => s.value === phraseOpts.separator) ? phraseOpts.separator : ''}
                        onChange={(e) => updatePassphraseOptions({ separator: e.target.value })}
                        placeholder="..."
                        className="w-16 text-center text-sm font-mono bg-white/[0.02] border border-noir-border rounded-lg px-2 text-white placeholder-zinc-600 focus:outline-none focus:border-green-500/50"
                      />
                    </div>
                  </div>

                  {/* Capitalize toggle */}
                  <button
                    type="button"
                    onClick={() => updatePassphraseOptions({ capitalize: !phraseOpts.capitalize })}
                    className="flex items-center justify-between px-3 py-2 rounded-lg border border-noir-border text-sm transition-colors hover:bg-white/5"
                  >
                    <span className="text-zinc-300">Capitalize Words</span>
                    <div className={`w-8 h-[18px] rounded-full transition-colors flex items-center ${phraseOpts.capitalize ? 'bg-green-500 justify-end' : 'bg-zinc-700 justify-start'}`}>
                      <div className="w-3.5 h-3.5 rounded-full bg-white mx-0.5" />
                    </div>
                  </button>

                  {/* Include number toggle */}
                  <button
                    type="button"
                    onClick={() => updatePassphraseOptions({ includeNumber: !phraseOpts.includeNumber })}
                    className="flex items-center justify-between px-3 py-2 rounded-lg border border-noir-border text-sm transition-colors hover:bg-white/5"
                  >
                    <span className="text-zinc-300">Include Number</span>
                    <div className={`w-8 h-[18px] rounded-full transition-colors flex items-center ${phraseOpts.includeNumber ? 'bg-green-500 justify-end' : 'bg-zinc-700 justify-start'}`}>
                      <div className="w-3.5 h-3.5 rounded-full bg-white mx-0.5" />
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* ── Section 4: Strength Analysis ── */}
            <div className="bg-noir-surface rounded-xl border border-noir-border p-5">
              <h2 className="text-sm font-medium text-zinc-300 mb-4">Strength Analysis</h2>

              {/* Strength bar */}
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((segment) => (
                  <div
                    key={segment}
                    className="h-1.5 flex-1 rounded-full transition-colors"
                    style={{
                      backgroundColor: segment <= STRENGTH_SEGMENTS[strength.level]
                        ? STRENGTH_COLORS[strength.level]
                        : 'rgba(255,255,255,0.06)',
                    }}
                  />
                ))}
              </div>

              {/* Strength label */}
              <div className="flex items-center justify-between mb-4">
                <span
                  className="text-lg font-semibold font-manrope"
                  style={{ color: STRENGTH_COLORS[strength.level] }}
                >
                  {STRENGTH_LABELS[strength.level]}
                </span>
                <span className="text-xs text-zinc-500 font-mono">
                  {strength.entropy.toFixed(1)} bits
                </span>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                  <div className="text-[11px] text-zinc-500 mb-0.5">Crack Time</div>
                  <div className="text-sm text-zinc-200 font-medium">{strength.crackTime}</div>
                  <div className="text-[10px] text-zinc-600 mt-0.5">at 10B guesses/sec</div>
                </div>
                <div className="px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                  <div className="text-[11px] text-zinc-500 mb-0.5">Charset Size</div>
                  <div className="text-sm text-zinc-200 font-mono font-medium">{strength.charsetSize.toLocaleString()}</div>
                  <div className="text-[10px] text-zinc-600 mt-0.5">
                    {config.mode === 'passphrase' ? 'words in list' : 'unique characters'}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

/* ── Types ── */

import { WORDLIST } from "../../utils/constants"

export type GenerationMode = 'characters' | 'passphrase'

export interface CharacterOptions {
  length: number
  uppercase: boolean
  lowercase: boolean
  numbers: boolean
  symbols: boolean
  excludeAmbiguous: boolean
  customExclude: string
}

export interface PassphraseOptions {
  wordCount: number
  separator: string
  capitalize: boolean
  includeNumber: boolean
}

export interface PasswordConfig {
  mode: GenerationMode
  characters: CharacterOptions
  passphrase: PassphraseOptions
}

export type StrengthLevel = 'weak' | 'fair' | 'good' | 'strong' | 'very-strong'

export interface StrengthAnalysis {
  level: StrengthLevel
  score: number
  entropy: number
  crackTime: string
  charsetSize: number
}

export interface Preset {
  id: string
  label: string
  description: string
  config: PasswordConfig
}

/* ── Character sets ── */

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz'
const NUMBERS = '0123456789'
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?'
const AMBIGUOUS = 'O0l1I'

/* ── Crypto-safe random ── */

function randomIndex(max: number): number {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  return array[0] % max
}

/* ── Character password generation ── */

function buildCharset(opts: CharacterOptions): string {
  let charset = ''
  if (opts.uppercase) charset += UPPERCASE
  if (opts.lowercase) charset += LOWERCASE
  if (opts.numbers) charset += NUMBERS
  if (opts.symbols) charset += SYMBOLS

  if (opts.excludeAmbiguous) {
    charset = charset.split('').filter((c) => !AMBIGUOUS.includes(c)).join('')
  }
  if (opts.customExclude) {
    const excluded = new Set(opts.customExclude.split(''))
    charset = charset.split('').filter((c) => !excluded.has(c)).join('')
  }

  return charset
}

function generateCharacterPassword(opts: CharacterOptions): string {
  const charset = buildCharset(opts)
  if (charset.length === 0) return ''

  let password = ''
  for (let i = 0; i < opts.length; i++) {
    password += charset[randomIndex(charset.length)]
  }
  return password
}

/* ── Passphrase generation ── */

function generatePassphrase(opts: PassphraseOptions): string {
  const words: string[] = []
  for (let i = 0; i < opts.wordCount; i++) {
    let word = WORDLIST[randomIndex(WORDLIST.length)]
    if (opts.capitalize) {
      word = word.charAt(0).toUpperCase() + word.slice(1)
    }
    words.push(word)
  }

  if (opts.includeNumber) {
    const idx = randomIndex(words.length)
    words[idx] = words[idx] + randomIndex(10).toString()
  }

  return words.join(opts.separator)
}

/* ── Public API ── */

export function generatePassword(config: PasswordConfig): string {
  if (config.mode === 'passphrase') {
    return generatePassphrase(config.passphrase)
  }
  return generateCharacterPassword(config.characters)
}

export function analyzeStrength(config: PasswordConfig): StrengthAnalysis {
  let entropy: number
  let charsetSize: number

  if (config.mode === 'passphrase') {
    charsetSize = WORDLIST.length
    entropy = Math.log2(charsetSize) * config.passphrase.wordCount
    if (config.passphrase.includeNumber) {
      entropy += Math.log2(10) + Math.log2(config.passphrase.wordCount)
    }
  } else {
    const charset = buildCharset(config.characters)
    charsetSize = charset.length
    entropy = charsetSize > 0 ? Math.log2(charsetSize) * config.characters.length : 0
  }

  const score = Math.min(100, Math.round((entropy / 128) * 100))

  let level: StrengthLevel
  if (entropy < 28) level = 'weak'
  else if (entropy < 50) level = 'fair'
  else if (entropy < 70) level = 'good'
  else if (entropy < 100) level = 'strong'
  else level = 'very-strong'

  const crackTime = estimateCrackTime(entropy)

  return { level, score, entropy, crackTime, charsetSize }
}

/* ── Crack time estimation (10 billion guesses/sec) ── */

function estimateCrackTime(entropy: number): string {
  const guessesPerSecond = 1e10
  const totalGuesses = Math.pow(2, entropy)
  const seconds = totalGuesses / guessesPerSecond / 2 // average case

  if (seconds < 1) return 'Instant'
  if (seconds < 60) return `${Math.round(seconds)} seconds`
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`
  if (seconds < 31536000) return `${Math.round(seconds / 86400)} days`

  const years = seconds / 31536000
  if (years < 1000) return `${Math.round(years)} years`
  if (years < 1e6) return `${Math.round(years / 1000)} thousand years`
  if (years < 1e9) return `${Math.round(years / 1e6)} million years`
  if (years < 1e12) return `${Math.round(years / 1e9)} billion years`
  return 'Centuries+'
}

/* ── Presets ── */

const DEFAULT_PASSPHRASE: PassphraseOptions = {
  wordCount: 4,
  separator: '-',
  capitalize: true,
  includeNumber: false,
}

const DEFAULT_CHARACTERS: CharacterOptions = {
  length: 16,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
  excludeAmbiguous: false,
  customExclude: '',
}

export function getPresets(): Preset[] {
  return [
    {
      id: 'pin',
      label: 'PIN',
      description: '4 digits',
      config: {
        mode: 'characters',
        characters: { ...DEFAULT_CHARACTERS, length: 4, uppercase: false, lowercase: false, numbers: true, symbols: false },
        passphrase: DEFAULT_PASSPHRASE,
      },
    },
    {
      id: 'simple',
      label: 'Simple',
      description: '8 chars, alphanumeric',
      config: {
        mode: 'characters',
        characters: { ...DEFAULT_CHARACTERS, length: 8, symbols: false },
        passphrase: DEFAULT_PASSPHRASE,
      },
    },
    {
      id: 'strong',
      label: 'Strong',
      description: '16 chars, all types',
      config: {
        mode: 'characters',
        characters: { ...DEFAULT_CHARACTERS },
        passphrase: DEFAULT_PASSPHRASE,
      },
    },
    {
      id: 'passphrase',
      label: 'Passphrase',
      description: '4 words, dashed',
      config: {
        mode: 'passphrase',
        characters: DEFAULT_CHARACTERS,
        passphrase: { ...DEFAULT_PASSPHRASE },
      },
    },
    {
      id: 'maximum',
      label: 'Maximum',
      description: '32 chars, all types',
      config: {
        mode: 'characters',
        characters: { ...DEFAULT_CHARACTERS, length: 32 },
        passphrase: DEFAULT_PASSPHRASE,
      },
    },
  ]
}

export function getDefaultConfig(): PasswordConfig {
  return getPresets().find((p) => p.id === 'strong')!.config
}


import { generatePassword, analyzeStrength, getPresets, getDefaultConfig } from '../tools/passwordGenerator/engine'
import type { PasswordConfig } from '../tools/passwordGenerator/engine'

// jsdom includes crypto.getRandomValues in modern versions, but just in case:
beforeAll(() => {
  if (!globalThis.crypto?.getRandomValues) {
    Object.defineProperty(globalThis, 'crypto', {
      value: {
        getRandomValues: (arr: Uint32Array) => {
          for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 0xffffffff)
          return arr
        },
      },
    })
  }
})

describe('generatePassword (character mode)', () => {
  const base: PasswordConfig = {
    mode: 'characters',
    characters: {
      length: 16,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
      excludeAmbiguous: false,
      customExclude: '',
    },
    passphrase: { wordCount: 4, separator: '-', capitalize: true, includeNumber: false },
  }

  it('returns a string of the correct length', () => {
    const pw = generatePassword(base)
    expect(pw).toHaveLength(16)
  })

  it('respects minimum length', () => {
    const config = { ...base, characters: { ...base.characters, length: 4 } }
    expect(generatePassword(config)).toHaveLength(4)
  })

  it('respects maximum length', () => {
    const config = { ...base, characters: { ...base.characters, length: 128 } }
    expect(generatePassword(config)).toHaveLength(128)
  })

  it('generates only numbers when only numbers are enabled', () => {
    const config: PasswordConfig = {
      ...base,
      characters: { ...base.characters, uppercase: false, lowercase: false, numbers: true, symbols: false },
    }
    const pw = generatePassword(config)
    expect(pw).toMatch(/^\d+$/)
  })

  it('generates only lowercase when only lowercase is enabled', () => {
    const config: PasswordConfig = {
      ...base,
      characters: { ...base.characters, uppercase: false, lowercase: true, numbers: false, symbols: false },
    }
    const pw = generatePassword(config)
    expect(pw).toMatch(/^[a-z]+$/)
  })

  it('generates only uppercase when only uppercase is enabled', () => {
    const config: PasswordConfig = {
      ...base,
      characters: { ...base.characters, uppercase: true, lowercase: false, numbers: false, symbols: false },
    }
    const pw = generatePassword(config)
    expect(pw).toMatch(/^[A-Z]+$/)
  })

  it('excludes ambiguous characters when option is set', () => {
    const config: PasswordConfig = {
      ...base,
      characters: { ...base.characters, length: 100, excludeAmbiguous: true },
    }
    const pw = generatePassword(config)
    expect(pw).not.toMatch(/[O0l1I]/)
  })

  it('excludes custom characters', () => {
    const config: PasswordConfig = {
      ...base,
      characters: { ...base.characters, length: 100, customExclude: 'abc' },
    }
    const pw = generatePassword(config)
    expect(pw).not.toMatch(/[abc]/)
  })

  it('returns empty string when no charset is available', () => {
    const config: PasswordConfig = {
      ...base,
      characters: { ...base.characters, uppercase: false, lowercase: false, numbers: false, symbols: false },
    }
    expect(generatePassword(config)).toBe('')
  })
})

describe('generatePassword (passphrase mode)', () => {
  const base: PasswordConfig = {
    mode: 'passphrase',
    characters: {
      length: 16, uppercase: true, lowercase: true, numbers: true, symbols: true,
      excludeAmbiguous: false, customExclude: '',
    },
    passphrase: { wordCount: 4, separator: '-', capitalize: true, includeNumber: false },
  }

  it('returns the correct number of words', () => {
    const pw = generatePassword(base)
    const words = pw.split('-')
    expect(words).toHaveLength(4)
  })

  it('respects custom separator', () => {
    const config = { ...base, passphrase: { ...base.passphrase, separator: '.' } }
    const pw = generatePassword(config)
    expect(pw.split('.')).toHaveLength(4)
  })

  it('capitalizes words when option is set', () => {
    const config = { ...base, passphrase: { ...base.passphrase, capitalize: true } }
    const pw = generatePassword(config)
    const words = pw.split('-')
    words.forEach((word) => {
      // Remove any trailing number before checking capitalization
      const clean = word.replace(/\d+$/, '')
      if (clean.length > 0) {
        expect(clean[0]).toMatch(/[A-Z]/)
      }
    })
  })

  it('does not capitalize when option is false', () => {
    const config = { ...base, passphrase: { ...base.passphrase, capitalize: false, includeNumber: false } }
    const pw = generatePassword(config)
    const words = pw.split('-')
    words.forEach((word) => {
      expect(word).toMatch(/^[a-z]+$/)
    })
  })
})

describe('analyzeStrength', () => {
  it('returns weak for PIN config', () => {
    const pin: PasswordConfig = {
      mode: 'characters',
      characters: {
        length: 4, uppercase: false, lowercase: false, numbers: true, symbols: false,
        excludeAmbiguous: false, customExclude: '',
      },
      passphrase: { wordCount: 4, separator: '-', capitalize: true, includeNumber: false },
    }
    const result = analyzeStrength(pin)
    expect(result.level).toBe('weak')
    expect(result.entropy).toBeCloseTo(Math.log2(10) * 4, 1)
  })

  it('returns strong or very-strong for 16-char all-types', () => {
    const strong: PasswordConfig = {
      mode: 'characters',
      characters: {
        length: 16, uppercase: true, lowercase: true, numbers: true, symbols: true,
        excludeAmbiguous: false, customExclude: '',
      },
      passphrase: { wordCount: 4, separator: '-', capitalize: true, includeNumber: false },
    }
    const result = analyzeStrength(strong)
    expect(['strong', 'very-strong']).toContain(result.level)
    expect(result.entropy).toBeGreaterThan(70)
  })

  it('returns correct charset size', () => {
    const numbersOnly: PasswordConfig = {
      mode: 'characters',
      characters: {
        length: 8, uppercase: false, lowercase: false, numbers: true, symbols: false,
        excludeAmbiguous: false, customExclude: '',
      },
      passphrase: { wordCount: 4, separator: '-', capitalize: true, includeNumber: false },
    }
    expect(analyzeStrength(numbersOnly).charsetSize).toBe(10)
  })

  it('score is between 0 and 100', () => {
    const config = getDefaultConfig()
    const result = analyzeStrength(config)
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  })

  it('crack time is a non-empty string', () => {
    const config = getDefaultConfig()
    const result = analyzeStrength(config)
    expect(result.crackTime.length).toBeGreaterThan(0)
  })
})

describe('presets', () => {
  it('returns 5 presets', () => {
    expect(getPresets()).toHaveLength(5)
  })

  it('all presets generate valid passwords', () => {
    for (const preset of getPresets()) {
      const pw = generatePassword(preset.config)
      expect(pw.length).toBeGreaterThan(0)
    }
  })

  it('default config is the strong preset', () => {
    const defaultConfig = getDefaultConfig()
    const strongPreset = getPresets().find((p) => p.id === 'strong')!
    expect(defaultConfig).toEqual(strongPreset.config)
  })

  it('each preset has unique id', () => {
    const ids = getPresets().map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

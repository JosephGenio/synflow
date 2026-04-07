import { useState, useCallback, useMemo, useEffect } from 'react'
import {
  generatePassword,
  analyzeStrength,
  getPresets,
  getDefaultConfig,
  type PasswordConfig,
  type CharacterOptions,
  type PassphraseOptions,
  type StrengthAnalysis,
  type Preset,
} from './engine'

interface UsePasswordGenerator {
  password: string
  config: PasswordConfig
  activePresetId: string | null
  strength: StrengthAnalysis
  copyFeedback: boolean
  presets: Preset[]
  regenerate: () => void
  applyPreset: (presetId: string) => void
  updateCharacterOptions: (partial: Partial<CharacterOptions>) => void
  updatePassphraseOptions: (partial: Partial<PassphraseOptions>) => void
  setMode: (mode: PasswordConfig['mode']) => void
  copyToClipboard: () => void
}

export function usePasswordGenerator(): UsePasswordGenerator {
  const presets = useMemo(() => getPresets(), [])
  const [config, setConfig] = useState<PasswordConfig>(getDefaultConfig)
  const [activePresetId, setActivePresetId] = useState<string | null>('strong')
  const [password, setPassword] = useState('')
  const [copyFeedback, setCopyFeedback] = useState(false)

  const strength = useMemo(() => analyzeStrength(config), [config])

  const regenerate = useCallback(() => {
    setPassword(generatePassword(config))
  }, [config])

  // Generate on mount and when config changes
  useEffect(() => {
    setPassword(generatePassword(config))
  }, [config])

  const applyPreset = useCallback((presetId: string) => {
    const preset = presets.find((p) => p.id === presetId)
    if (!preset) return
    setActivePresetId(presetId)
    setConfig(structuredClone(preset.config))
  }, [presets])

  const updateCharacterOptions = useCallback((partial: Partial<CharacterOptions>) => {
    setActivePresetId(null)
    setConfig((prev) => ({
      ...prev,
      characters: { ...prev.characters, ...partial },
    }))
  }, [])

  const updatePassphraseOptions = useCallback((partial: Partial<PassphraseOptions>) => {
    setActivePresetId(null)
    setConfig((prev) => ({
      ...prev,
      passphrase: { ...prev.passphrase, ...partial },
    }))
  }, [])

  const setMode = useCallback((mode: PasswordConfig['mode']) => {
    setActivePresetId(null)
    setConfig((prev) => ({ ...prev, mode }))
  }, [])

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(password).then(() => {
      setCopyFeedback(true)
      setTimeout(() => setCopyFeedback(false), 2000)
    })
  }, [password])

  return {
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
  }
}

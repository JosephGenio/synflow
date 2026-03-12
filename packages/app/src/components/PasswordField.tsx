import { useState } from 'react'
import { FieldError, UseFormRegisterReturn } from 'react-hook-form'

type StrengthLevel = 'weak' | 'fair' | 'good' | 'strong'

interface PasswordStrength {
  level: StrengthLevel
  score: number
}

function getPasswordStrength(password: string): PasswordStrength {
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 2) return { level: 'weak', score }
  if (score === 3) return { level: 'fair', score }
  if (score === 4) return { level: 'good', score }
  return { level: 'strong', score }
}

const strengthColors: Record<StrengthLevel, string> = {
  weak: 'bg-red-500',
  fair: 'bg-yellow-500',
  good: 'bg-blue-500',
  strong: 'bg-green-500',
}

const strengthLabels: Record<StrengthLevel, string> = {
  weak: 'Weak',
  fair: 'Fair',
  good: 'Good',
  strong: 'Strong',
}

const inputClass = 'w-full px-3.5 py-2.5 rounded-lg border text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors'
const inputDefault = `${inputClass} border-gray-300 dark:border-gray-600`
const inputError = `${inputClass} border-red-500 dark:border-red-500`

export interface PasswordFieldProps {
  label: string
  placeholder: string
  register: UseFormRegisterReturn
  error?: FieldError
  showStrength?: boolean
  passwordValue?: string
  showForgotPassword?: boolean
  onForgotPassword?: () => void
  autoComplete?: string
}

const EyeIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const EyeOffIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)

export default function PasswordField({
  label,
  placeholder,
  register,
  error,
  showStrength = false,
  passwordValue,
  showForgotPassword = false,
  onForgotPassword,
  autoComplete = 'current-password',
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false)
  const strength = passwordValue ? getPasswordStrength(passwordValue) : null

  const inputId = register.name

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
        {showForgotPassword && onForgotPassword && (
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-medium transition-colors"
          >
            Forgot password?
          </button>
        )}
      </div>

      <div className="relative">
        <input
          id={inputId}
          type={showPassword ? 'text' : 'password'}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={error ? inputError : inputDefault}
          {...register}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>

      {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error.message}</p>}

      {showStrength && passwordValue && passwordValue.length > 0 && strength && (
        <div className="mt-2">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= strength.score ? strengthColors[strength.level] : 'bg-gray-200 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
          <p className={`text-xs mt-1 ${
            strength.level === 'weak' ? 'text-red-500' :
            strength.level === 'fair' ? 'text-yellow-500' :
            strength.level === 'good' ? 'text-blue-500' :
            'text-green-500'
          }`}>
            {strengthLabels[strength.level]}
          </p>
        </div>
      )}
    </div>
  )
}

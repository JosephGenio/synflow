import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTheme } from './ThemeContext'

interface SetPasswordScreenProps {
  token: string
  onComplete: () => void
}

interface SetPasswordFormData {
  password: string
  confirmPassword: string
}

type StrengthLevel = 'weak' | 'fair' | 'good' | 'strong'

function getPasswordStrength(password: string): { level: StrengthLevel; score: number } {
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

export default function SetPasswordScreen({ token, onComplete }: SetPasswordScreenProps) {
  const { isDark, toggleTheme } = useTheme()
  const [apiError, setApiError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SetPasswordFormData>()

  const passwordValue = watch('password', '')
  const strength = getPasswordStrength(passwordValue)

  const onSubmit = async (data: SetPasswordFormData): Promise<void> => {
    setApiError(null)
    try {
      const res = await fetch('/api/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: data.password }),
      })
      const json = await res.json()

      if (!res.ok) {
        setApiError(json.error ?? json.errors?.join(', ') ?? 'Failed to set password')
        return
      }

      onComplete()
    } catch {
      setApiError('Unable to connect to the server. Please try again.')
    }
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-200">
      {/* Theme toggle */}
      <div className="flex justify-end p-4">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          {isDark ? (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4">
              <svg
                className="w-9 h-9 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">synflow</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Set your password</p>
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 transition-colors duration-200">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Your email has been verified. Create a password to complete your account setup.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Create a password"
                    className={errors.password ? inputError : inputDefault}
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: 8, message: 'Password must be at least 8 characters' },
                      validate: {
                        uppercase: (v) => /[A-Z]/.test(v) || 'Must contain at least one uppercase letter',
                        lowercase: (v) => /[a-z]/.test(v) || 'Must contain at least one lowercase letter',
                        number: (v) => /\d/.test(v) || 'Must contain at least one number',
                        special: (v) => /[^A-Za-z0-9]/.test(v) || 'Must contain at least one special character',
                      },
                    })}
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
                {errors.password && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>}

                {/* Strength indicator */}
                {passwordValue.length > 0 && (
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

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Confirm your password"
                    className={errors.confirmPassword ? inputError : inputDefault}
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: (value) => value === watch('password') || 'Passwords do not match',
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword.message}</p>}
              </div>

              {/* API Error */}
              {apiError && (
                <div className="rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400">
                  {apiError}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 mt-2"
              >
                {isSubmitting ? 'Setting Password...' : 'Set Password'}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 transition-colors duration-200">
        <div className="max-w-md mx-auto flex flex-col items-center gap-1 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} Synflow. All rights reserved.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Built with React &amp; TypeScript &mdash; v0.1.0
          </p>
        </div>
      </footer>
    </div>
  )
}

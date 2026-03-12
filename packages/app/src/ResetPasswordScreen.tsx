import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTheme } from './ThemeContext'
import PasswordField from './components/PasswordField'

interface ResetPasswordScreenProps {
  token: string
  onComplete: () => void
}

interface ResetPasswordFormData {
  password: string
  confirmPassword: string
}

export default function ResetPasswordScreen({ token, onComplete }: ResetPasswordScreenProps) {
  const { isDark, toggleTheme } = useTheme()
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>()

  const passwordValue = watch('password', '')

  const onSubmit = async (data: ResetPasswordFormData): Promise<void> => {
    setApiError(null)
    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: data.password }),
      })
      const json = await res.json()

      if (!res.ok) {
        setApiError(json.error ?? json.errors?.join(', ') ?? 'Failed to reset password')
        return
      }

      onComplete()
    } catch {
      setApiError('Unable to connect to the server. Please try again.')
    }
  }

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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">synflo</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Reset your password</p>
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 transition-colors duration-200">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Enter your new password below.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
              {/* Password */}
              <PasswordField
                label="New Password"
                placeholder="Create a new password"
                register={register('password', {
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Password must be at least 8 characters' },
                  validate: {
                    uppercase: (v) => /[A-Z]/.test(v) || 'Must contain at least one uppercase letter',
                    lowercase: (v) => /[a-z]/.test(v) || 'Must contain at least one lowercase letter',
                    number: (v) => /\d/.test(v) || 'Must contain at least one number',
                    special: (v) => /[^A-Za-z0-9]/.test(v) || 'Must contain at least one special character',
                  },
                })}
                error={errors.password}
                showStrength
                passwordValue={passwordValue}
                autoComplete="new-password"
              />

              {/* Confirm Password */}
              <PasswordField
                label="Confirm New Password"
                placeholder="Confirm your new password"
                register={register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) => value === watch('password') || 'Passwords do not match',
                })}
                error={errors.confirmPassword}
                autoComplete="new-password"
              />

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
                {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 transition-colors duration-200">
        <div className="max-w-md mx-auto flex flex-col items-center gap-1 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} Synflo. All rights reserved.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Built with React &amp; TypeScript &mdash; v0.1.0
          </p>
        </div>
      </footer>
    </div>
  )
}

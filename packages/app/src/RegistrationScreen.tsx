import { useForm } from 'react-hook-form'
import { useTheme } from './ThemeContext'
import { isValidEmail } from './utils/validation'

interface RegistrationScreenProps {
  onRegister: () => void
  onBackToLogin: () => void
}

interface RegistrationFormData {
  firstName: string
  middleName: string
  lastName: string
  email: string
  contactNumber: string
}

const inputClass = 'w-full px-3.5 py-2.5 rounded-lg border text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors'
const inputDefault = `${inputClass} border-gray-300 dark:border-gray-600`
const inputError = `${inputClass} border-red-500 dark:border-red-500`

export default function RegistrationScreen({ onRegister, onBackToLogin }: RegistrationScreenProps) {
  const { isDark, toggleTheme } = useTheme()
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<RegistrationFormData>({
    defaultValues: { contactNumber: '+63' },
  })

  const onSubmit = (): void => {
    onRegister()
    console.log(getValues())
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
        <div className="w-full max-w-md lg:max-w-2xl">
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
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create your account</p>
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 transition-colors duration-200">
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6 lg:space-y-5">
              {/* Personal Information */}
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Personal Information</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-4">
                  {/* First Name */}
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      autoComplete="given-name"
                      placeholder="First name"
                      className={errors.firstName ? inputError : inputDefault}
                      {...register('firstName', { required: 'First name is required' })}
                    />
                    {errors.firstName && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.firstName.message}</p>}
                  </div>

                  {/* Middle Name */}
                  <div>
                    <label htmlFor="middleName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Middle Name
                    </label>
                    <input
                      id="middleName"
                      type="text"
                      autoComplete="additional-name"
                      placeholder="Middle name"
                      className={errors.middleName ? inputError : inputDefault}
                      {...register('middleName', { required: 'Middle name is required' })}
                    />
                    {errors.middleName && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.middleName.message}</p>}
                  </div>

                  {/* Last Name */}
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      autoComplete="family-name"
                      placeholder="Enter your last name"
                      className={errors.lastName ? inputError : inputDefault}
                      {...register('lastName', { required: 'Last name is required' })}
                    />
                    {errors.lastName && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.lastName.message}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="Enter your email"
                      className={errors.email ? inputError : inputDefault}
                      {...register('email', {
                        required: 'Email is required',
                        validate: (value) => isValidEmail(value) || 'Please enter a valid email address',
                      })}
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>}
                  </div>

                  {/* Contact Number */}
                  <div>
                    <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Contact Number
                    </label>
                    <input
                      id="contactNumber"
                      type="tel"
                      autoComplete="tel"
                      placeholder="+63"
                      className={errors.contactNumber ? inputError : inputDefault}
                      {...register('contactNumber', {
                        validate: (value) => {
                          if (!value || value === '+63') return true
                          return /^\+63\d{10}$/.test(value) || 'Contact number must start with +63 followed by 10 digits'
                        },
                      })}
                    />
                    {errors.contactNumber && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.contactNumber.message}</p>}
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 mt-2"
              >
                Create Account
              </button>
            </form>

            {/* Back to login link */}
            <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onBackToLogin}
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-medium transition-colors"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 transition-colors duration-200">
        <div className="max-w-md lg:max-w-2xl mx-auto flex flex-col items-center gap-1 text-center">
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

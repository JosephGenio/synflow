import { useTheme } from './ThemeContext'
import Footer from './components/Footer'

interface HomeScreenProps {
  onLogin: () => void
  onSignUp: () => void
  onJsonParser: () => void
}

export default function HomeScreen({ onLogin, onSignUp, onJsonParser }: HomeScreenProps) {
  const { isDark, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors">
      <div className="flex-1 flex flex-col items-center justify-center relative">
        <button
          type="button"
          onClick={toggleTheme}
          className="absolute top-4 right-4 p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          aria-label="Toggle theme"
        >
          {isDark ? '☀️' : '🌙'}
        </button>

        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">Home</h1>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={onLogin}
            className="px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
          >
            Log in
          </button>
          <button
            type="button"
            onClick={onSignUp}
            className="px-6 py-2.5 rounded-lg border border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 font-medium text-sm hover:bg-indigo-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
          >
            Sign up
          </button>
        </div>

        <button
          type="button"
          onClick={onJsonParser}
          className="mt-6 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-medium transition-colors"
        >
          JSON Parser Tool
        </button>
      </div>

      <Footer />
    </div>
  )
}

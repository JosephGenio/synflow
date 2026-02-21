import { useState, useEffect } from 'react'
import ThemeProvider from './ThemeContext'
import LoginScreen from './LoginScreen'
import type { UserInfo } from './LoginScreen'
import DashboardScreen from './DashboardScreen'
import RegistrationScreen from './RegistrationScreen'
import SetPasswordScreen from './SetPasswordScreen'
import ForgotPasswordScreen from './ForgotPasswordScreen'
import ResetPasswordScreen from './ResetPasswordScreen'

type View = 'login' | 'register' | 'dashboard' | 'set-password' | 'forgot-password' | 'reset-password'

function AppRoutes() {
  const [view, setView] = useState<View>('login')
  const [verifyToken, setVerifyToken] = useState<string | null>(null)
  const [user, setUser] = useState<UserInfo | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlView = params.get('view')
    const token = params.get('token')

    if (urlView === 'set-password' && token) {
      setVerifyToken(token)
      setView('set-password')
      window.history.replaceState({}, '', '/')
      setIsCheckingAuth(false)
      return
    }

    if (urlView === 'reset-password' && token) {
      setVerifyToken(token)
      setView('reset-password')
      window.history.replaceState({}, '', '/')
      setIsCheckingAuth(false)
      return
    }

    fetch('/api/me', { credentials: 'include' })
      .then((res) => {
        if (res.ok) return res.json()
        throw new Error('Not authenticated')
      })
      .then((json) => {
        setUser(json.user as UserInfo)
        setView('dashboard')
      })
      .catch(() => {
        // Not authenticated, stay on login
      })
      .finally(() => setIsCheckingAuth(false))
  }, [])

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (view === 'dashboard' && user) {
    return (
      <DashboardScreen
        user={user}
        onLogout={() => {
          setUser(null)
          setView('login')
        }}
      />
    )
  }
  if (view === 'set-password' && verifyToken) return (
    <SetPasswordScreen
      token={verifyToken}
      onComplete={() => setView('login')}
    />
  )
  if (view === 'reset-password' && verifyToken) return (
    <ResetPasswordScreen
      token={verifyToken}
      onComplete={() => setView('login')}
    />
  )
  if (view === 'forgot-password') return (
    <ForgotPasswordScreen
      onBackToLogin={() => setView('login')}
    />
  )
  if (view === 'register') return (
    <RegistrationScreen
      onRegister={() => setView('login')}
      onBackToLogin={() => setView('login')}
    />
  )
  return (
    <LoginScreen
      onLogin={(userData) => {
        setUser(userData)
        setView('dashboard')
      }}
      onSignUp={() => setView('register')}
      onForgotPassword={() => setView('forgot-password')}
    />
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AppRoutes />
    </ThemeProvider>
  )
}

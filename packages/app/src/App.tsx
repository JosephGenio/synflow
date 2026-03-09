import { useState, useEffect, useCallback } from 'react'
import ThemeProvider from './ThemeContext'
import LoginScreen from './LoginScreen'
import type { UserInfo } from './LoginScreen'
import DashboardScreen from './DashboardScreen'
import RegistrationScreen from './RegistrationScreen'
import SetPasswordScreen from './SetPasswordScreen'
import ForgotPasswordScreen from './ForgotPasswordScreen'
import ResetPasswordScreen from './ResetPasswordScreen'
import HomeScreen from './HomeScreen'
import JsonParserScreen from './tools/JsonParserScreen'

type View = 'home' | 'login' | 'register' | 'dashboard' | 'set-password' | 'forgot-password' | 'reset-password' | 'json-parser'

const pathToView: Record<string, View> = {
  '/tools/json-parser': 'json-parser',
}

const viewToPath: Partial<Record<View, string>> = {
  'json-parser': '/tools/json-parser',
  'home': '/',
}

function resolveInitialView(): View {
  const path = window.location.pathname
  if (pathToView[path]) return pathToView[path]
  return 'home'
}

function AppRoutes() {
  const [view, setView] = useState<View>(resolveInitialView)
  const [verifyToken, setVerifyToken] = useState<string | null>(null)
  const [user, setUser] = useState<UserInfo | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  const navigate = useCallback((target: View) => {
    setView(target)
    const targetPath = viewToPath[target]
    if (targetPath && window.location.pathname !== targetPath) {
      window.history.pushState({ view: target }, '', targetPath)
    } else if (!targetPath && window.location.pathname !== '/') {
      window.history.pushState({ view: target }, '', '/')
    }
  }, [])

  useEffect(() => {
    function handlePopState(): void {
      const path = window.location.pathname
      const resolved = pathToView[path] ?? 'home'
      setView(resolved)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

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

    if (view === 'json-parser') {
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
        // Not authenticated, stay on current view
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
          navigate('login')
        }}
      />
    )
  }
  if (view === 'set-password' && verifyToken) return (
    <SetPasswordScreen
      token={verifyToken}
      onComplete={() => navigate('login')}
    />
  )
  if (view === 'reset-password' && verifyToken) return (
    <ResetPasswordScreen
      token={verifyToken}
      onComplete={() => navigate('login')}
    />
  )
  if (view === 'forgot-password') return (
    <ForgotPasswordScreen
      onBackToLogin={() => navigate('login')}
    />
  )
  if (view === 'register') return (
    <RegistrationScreen
      onRegister={() => navigate('login')}
      onBackToLogin={() => navigate('login')}
    />
  )
  if (view === 'json-parser') return (
    <JsonParserScreen onHome={() => navigate('home')} />
  )
  if (view === 'login') return (
    <LoginScreen
      onLogin={(userData) => {
        setUser(userData)
        navigate('dashboard')
      }}
      onSignUp={() => navigate('register')}
      onForgotPassword={() => navigate('forgot-password')}
    />
  )
  return (
    <HomeScreen
      onLogin={() => navigate('login')}
      onSignUp={() => navigate('register')}
      onJsonParser={() => navigate('json-parser')}
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

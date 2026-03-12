import { useState, useEffect, useCallback } from 'react'
import { Analytics } from '@vercel/analytics/react'
import ThemeProvider from './ThemeContext'
import LoginScreen from './LoginScreen'
import type { UserInfo } from './LoginScreen'
import DashboardScreen from './DashboardScreen'
import RegistrationScreen from './RegistrationScreen'
import SetPasswordScreen from './SetPasswordScreen'
import ForgotPasswordScreen from './ForgotPasswordScreen'
import ResetPasswordScreen from './ResetPasswordScreen'
import HomeScreen from './HomeScreen'
import ToolsCollectionScreen from './ToolsCollectionScreen'
import JsonParserScreen from './tools/JsonParserScreen'
import featureFlags from './featureFlags'

type View = 'home' | 'login' | 'register' | 'dashboard' | 'set-password' | 'forgot-password' | 'reset-password' | 'json-parser' | 'tools-collection'

const pathToView: Record<string, View> = {
  '/tools/json-parser': 'json-parser',
  '/tools': 'tools-collection',
}

const viewToPath: Partial<Record<View, string>> = {
  'json-parser': '/tools/json-parser',
  'tools-collection': '/tools',
  'home': '/',
}

function resolveInitialView(): View {
  const path = globalThis.location.pathname
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
    window.scrollTo(0, 0)
    const targetPath = viewToPath[target]
    if (targetPath && globalThis.location.pathname !== targetPath) {
      globalThis.history.pushState({ view: target }, '', targetPath)
    } else if (!targetPath && globalThis.location.pathname !== '/') {
      globalThis.history.pushState({ view: target }, '', '/')
    }
  }, [])

  useEffect(() => {
    function handlePopState(): void {
      const path = globalThis.location.pathname
      const resolved = pathToView[path] ?? 'home'
      setView(resolved)
      window.scrollTo(0, 0)
    }
    globalThis.addEventListener('popstate', handlePopState)
    return () => globalThis.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (!featureFlags.auth) {
      setIsCheckingAuth(false)
      return
    }

    const params = new URLSearchParams(globalThis.location.search)
    const urlView = params.get('view')
    const token = params.get('token')

    if (urlView === 'set-password' && token) {
      setVerifyToken(token)
      setView('set-password')
      globalThis.history.replaceState({}, '', '/')
      setIsCheckingAuth(false)
      return
    }

    if (urlView === 'reset-password' && token) {
      setVerifyToken(token)
      setView('reset-password')
      globalThis.history.replaceState({}, '', '/')
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

  if (featureFlags.auth) {
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
  }

  if (featureFlags.tools.jsonParser && view === 'json-parser') return (
    <JsonParserScreen onHome={() => navigate('home')} />
  )

  if (view === 'tools-collection') return (
    <ToolsCollectionScreen
      onHome={() => navigate('home')}
      onJsonParser={featureFlags.tools.jsonParser ? () => navigate('json-parser') : undefined}
    />
  )

  return (
    <HomeScreen
      onLogin={featureFlags.auth ? () => navigate('login') : undefined}
      onSignUp={featureFlags.auth ? () => navigate('register') : undefined}
      onJsonParser={featureFlags.tools.jsonParser ? () => navigate('json-parser') : undefined}
      onToolsCollection={() => navigate('tools-collection')}
    />
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AppRoutes />
      <Analytics />
    </ThemeProvider>
  )
}

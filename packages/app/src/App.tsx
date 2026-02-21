import { useState, useEffect } from 'react'
import ThemeProvider from './ThemeContext'
import LoginScreen from './LoginScreen'
import DashboardScreen from './DashboardScreen'
import RegistrationScreen from './RegistrationScreen'
import SetPasswordScreen from './SetPasswordScreen'

type View = 'login' | 'register' | 'dashboard' | 'set-password'

function AppRoutes() {
  const [view, setView] = useState<View>('login')
  const [verifyToken, setVerifyToken] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlView = params.get('view')
    const token = params.get('token')

    if (urlView === 'set-password' && token) {
      setVerifyToken(token)
      setView('set-password')
      window.history.replaceState({}, '', '/')
    }
  }, [])

  if (view === 'dashboard') return <DashboardScreen />
  if (view === 'set-password' && verifyToken) return (
    <SetPasswordScreen
      token={verifyToken}
      onComplete={() => setView('login')}
    />
  )
  if (view === 'register') return (
    <RegistrationScreen
      onRegister={() => setView('login')}
      onBackToLogin={() => setView('login')}
    />
  )
  return <LoginScreen onLogin={() => setView('dashboard')} onSignUp={() => setView('register')} />
}

export default function App() {
  return (
    <ThemeProvider>
      <AppRoutes />
    </ThemeProvider>
  )
}

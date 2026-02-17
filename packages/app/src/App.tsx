import { useState } from 'react'
import ThemeProvider from './ThemeContext'
import LoginScreen from './LoginScreen'
import DashboardScreen from './DashboardScreen'
import RegistrationScreen from './RegistrationScreen'

type View = 'login' | 'register' | 'dashboard'

function AppRoutes() {
  const [view, setView] = useState<View>('login')

  if (view === 'dashboard') return <DashboardScreen />
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

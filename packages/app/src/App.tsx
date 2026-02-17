import { useState } from 'react'
import ThemeProvider from './ThemeContext'
import LoginScreen from './LoginScreen'
import DashboardScreen from './DashboardScreen'

type View = 'login' | 'dashboard'

function AppRoutes() {
  const [view, setView] = useState<View>('login')

  if (view === 'dashboard') return <DashboardScreen />
  return <LoginScreen onLogin={() => setView('dashboard')} />
}

export default function App() {
  return (
    <ThemeProvider>
      <AppRoutes />
    </ThemeProvider>
  )
}

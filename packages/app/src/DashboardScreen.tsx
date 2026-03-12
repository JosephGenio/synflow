import React, { useEffect, useRef, useState } from 'react'
import { useTheme } from './ThemeContext'
import type { UserInfo } from './LoginScreen'
import MessagesPanel from './MessagesPanel'
import NotificationsPanel from './NotificationsPanel'
import ProfilePanel from './ProfilePanel'

type OpenPanel = 'messages' | 'notifications' | 'profile' | null

interface DashboardScreenProps {
  user: UserInfo
  onLogout: () => void
}

interface NavItem {
  label: string
  icon: React.ReactNode
}

function IconDashboard() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  )
}

function IconAnalytics() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}

function IconProjects() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function IconTeam() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function IconSettings() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

const mainNav: NavItem[] = [
  { label: 'Dashboard', icon: <IconDashboard /> },
  { label: 'Analytics', icon: <IconAnalytics /> },
  { label: 'Projects', icon: <IconProjects /> },
]

const settingsNav: NavItem[] = [
  { label: 'Team', icon: <IconTeam /> },
  { label: 'Settings', icon: <IconSettings /> },
]

export default function DashboardScreen({ user, onLogout }: DashboardScreenProps) {
  const { isDark, toggleTheme } = useTheme()
  const [activeItem, setActiveItem] = useState('Dashboard')
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null)

  const messagesRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  const panelRefs: Record<NonNullable<OpenPanel>, React.RefObject<HTMLDivElement>> = {
    messages: messagesRef,
    notifications: notificationsRef,
    profile: profileRef,
  }

  useEffect(() => {
    if (!openPanel) return
    function handleMouseDown(e: MouseEvent) {
      const ref = panelRefs[openPanel!]
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpenPanel(null)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [openPanel])

  function togglePanel(panel: NonNullable<OpenPanel>) {
    setOpenPanel((prev) => (prev === panel ? null : panel))
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-900 transition-colors duration-200">

      {/* ── Sidebar ── */}
      <aside className="w-64 flex-shrink-0 flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-gray-200 dark:border-gray-700">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <span className="text-base font-bold text-gray-900 dark:text-white tracking-tight">synflo</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {/* Main section */}
          <div>
            <p className="px-3 mb-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Main</p>
            <ul className="space-y-0.5">
              {mainNav.map(({ label, icon }) => (
                <li key={label}>
                  <button
                    type="button"
                    onClick={() => setActiveItem(label)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeItem === label
                        ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {icon}
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Settings section */}
          <div>
            <p className="px-3 mb-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Settings</p>
            <ul className="space-y-0.5">
              {settingsNav.map(({ label, icon }) => (
                <li key={label}>
                  <button
                    type="button"
                    onClick={() => setActiveItem(label)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeItem === label
                        ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {icon}
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </aside>

      {/* ── Right column ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Bar */}
        <header className="h-16 flex-shrink-0 flex items-center justify-between px-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          {/* Page title */}
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{activeItem}</h1>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            {/* Theme toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {isDark ? (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            {/* Messages */}
            <div ref={messagesRef} className="relative">
              <button
                type="button"
                aria-label="Messages"
                onClick={() => togglePanel('messages')}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </button>
              {openPanel === 'messages' && <MessagesPanel />}
            </div>

            {/* Notifications */}
            <div ref={notificationsRef} className="relative">
              <button
                type="button"
                aria-label="Notifications"
                onClick={() => togglePanel('notifications')}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </button>
              {/* Badge */}
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-800 pointer-events-none" />
              {openPanel === 'notifications' && <NotificationsPanel />}
            </div>

            {/* Profile avatar */}
            <div ref={profileRef} className="relative ml-1">
              <button
                type="button"
                aria-label="Profile"
                onClick={() => togglePanel('profile')}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors"
              >
                {user.firstName[0]}{user.lastName[0]}
              </button>
              {openPanel === 'profile' && <ProfilePanel user={user} onLogout={onLogout} />}
            </div>
          </div>
        </header>

        {/* Main + Footer scroll area */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          <main className="flex-1 p-6">
            {/* Greeting */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Good morning, {user.firstName}.</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Here's what's happening in your workspace today.</p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Total Projects', value: '—' },
                { label: 'Active Tasks', value: '—' },
                { label: 'Team Members', value: '—' },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5"
                >
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">{label}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
                </div>
              ))}
            </div>

            {/* Content block placeholder */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded w-2/3" />
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors duration-200">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                &copy; {new Date().getFullYear()} Synflo. All rights reserved.
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">v0.1.0</p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}

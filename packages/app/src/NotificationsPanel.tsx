import React from 'react'

interface Notification {
  id: number
  title: string
  description: string
  time: string
  read: boolean
  type: 'project' | 'task' | 'mention' | 'system'
}

const mockNotifications: Notification[] = [
  { id: 1, title: 'New project assigned', description: 'You have been added to Project Alpha', time: '5m ago', read: false, type: 'project' },
  { id: 2, title: 'Task completed', description: 'Design review was marked as done', time: '30m ago', read: false, type: 'task' },
  { id: 3, title: 'You were mentioned', description: '@you in #general: "Great work on the dashboard!"', time: '2h ago', read: false, type: 'mention' },
  { id: 4, title: 'System update', description: 'Synflow has been updated to v0.2.0', time: '1d ago', read: true, type: 'system' },
]

function NotificationIcon({ type }: { type: Notification['type'] }): React.ReactElement {
  const base = 'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0'

  if (type === 'project') {
    return (
      <div className={`${base} bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400`}>
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      </div>
    )
  }

  if (type === 'task') {
    return (
      <div className={`${base} bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400`}>
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
    )
  }

  if (type === 'mention') {
    return (
      <div className={`${base} bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400`}>
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
        </svg>
      </div>
    )
  }

  return (
    <div className={`${base} bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400`}>
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    </div>
  )
}

export default function NotificationsPanel(): React.ReactElement {
  const unreadCount = mockNotifications.filter((n) => !n.read).length

  return (
    <div className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 z-50 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 text-xs font-semibold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <button type="button" className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
          Mark all read
        </button>
      </div>

      {/* Notification list */}
      <ul className="divide-y divide-gray-100 dark:divide-gray-700 max-h-72 overflow-y-auto">
        {mockNotifications.map((n) => (
          <li
            key={n.id}
            className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${
              !n.read ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''
            }`}
          >
            <NotificationIcon type={n.type} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${n.read ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                {n.title}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{n.description}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{n.time}</p>
            </div>
            {!n.read && <span className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-2" />}
          </li>
        ))}
      </ul>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-700 text-center">
        <button type="button" className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
          View all notifications
        </button>
      </div>
    </div>
  )
}

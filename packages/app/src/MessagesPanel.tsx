import React from 'react'

interface Message {
  id: number
  name: string
  initials: string
  preview: string
  time: string
  unread: boolean
  color: string
}

const mockMessages: Message[] = [
  { id: 1, name: 'Sarah Chen', initials: 'SC', preview: 'Can you review the latest design mockups?', time: '2m ago', unread: true, color: 'bg-violet-500' },
  { id: 2, name: 'Alex Morgan', initials: 'AM', preview: 'Sprint planning is set for tomorrow at 10am', time: '1h ago', unread: true, color: 'bg-emerald-500' },
  { id: 3, name: 'Jordan Lee', initials: 'JL', preview: 'I pushed the fix to the staging branch', time: '3h ago', unread: false, color: 'bg-amber-500' },
  { id: 4, name: 'Riley Park', initials: 'RP', preview: 'Thanks for merging the PR!', time: '1d ago', unread: false, color: 'bg-rose-500' },
]

export default function MessagesPanel(): React.ReactElement {
  return (
    <div className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 z-50 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Messages</h3>
        <button type="button" className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
          Mark all read
        </button>
      </div>

      {/* Message list */}
      <ul className="divide-y divide-gray-100 dark:divide-gray-700">
        {mockMessages.map((msg) => (
          <li
            key={msg.id}
            className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
          >
            <div className={`w-8 h-8 rounded-full ${msg.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5`}>
              {msg.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className={`text-sm font-medium truncate ${msg.unread ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                  {msg.name}
                </p>
                <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{msg.time}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{msg.preview}</p>
            </div>
            {msg.unread && (
              <span className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-2" />
            )}
          </li>
        ))}
      </ul>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-700 text-center">
        <button type="button" className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
          View all messages
        </button>
      </div>
    </div>
  )
}

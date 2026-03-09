import { useState, memo } from 'react'
import type { JsonNode } from './types'

interface JsonTreeViewProps {
  node: JsonNode
  searchQuery?: string
  onSelectPath: (path: string) => void
}

const typeColors: Record<JsonNode['type'], string> = {
  string: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  number: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  boolean: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  null: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  object: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
  array: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400',
}

const valueColors: Record<string, string> = {
  string: 'text-green-600 dark:text-green-400',
  number: 'text-amber-600 dark:text-amber-400',
  boolean: 'text-blue-600 dark:text-blue-400',
  null: 'text-red-500 dark:text-red-400',
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query) return text
  const lower = text.toLowerCase()
  const idx = lower.indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}

function formatValue(value: unknown, type: JsonNode['type']): string {
  if (type === 'string') return `"${String(value)}"`
  if (type === 'null') return 'null'
  return String(value)
}

function TreeNode({ node, searchQuery, onSelectPath }: JsonTreeViewProps): React.ReactElement {
  const [expanded, setExpanded] = useState(node.depth < 2)
  const hasChildren = (node.type === 'object' || node.type === 'array') && node.children && node.children.length > 0
  const childCount = node.children?.length ?? 0

  return (
    <div>
      <div
        className="flex items-center gap-1.5 py-0.5 px-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer group"
        onClick={() => onSelectPath(node.path)}
      >
        {hasChildren ? (
          <button
            type="button"
            className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation()
              setExpanded(!expanded)
            }}
          >
            <svg
              className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <span className="w-4 flex-shrink-0" />
        )}

        <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">
          {highlightText(node.key, searchQuery ?? '')}
        </span>

        <span className={`text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${typeColors[node.type]}`}>
          {node.type}
        </span>

        {hasChildren ? (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {node.type === 'object' ? `{${childCount} key${childCount !== 1 ? 's' : ''}}` : `[${childCount} item${childCount !== 1 ? 's' : ''}]`}
          </span>
        ) : (
          <span className={`text-sm font-mono truncate ${valueColors[node.type] ?? 'text-gray-600 dark:text-gray-400'}`}>
            {highlightText(formatValue(node.value, node.type), searchQuery ?? '')}
          </span>
        )}
      </div>

      {hasChildren && expanded && (
        <div className="ml-4 border-l border-gray-200 dark:border-gray-700 pl-2">
          {node.children!.map((child) => (
            <MemoizedTreeNode
              key={child.path}
              node={child}
              searchQuery={searchQuery}
              onSelectPath={onSelectPath}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const MemoizedTreeNode = memo(TreeNode)

export default function JsonTreeView(props: JsonTreeViewProps): React.ReactElement {
  return <MemoizedTreeNode {...props} />
}

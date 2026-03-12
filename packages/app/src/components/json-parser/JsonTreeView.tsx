import { useState, memo } from 'react'
import type { JsonNode } from './types'

interface JsonTreeViewProps {
  node: JsonNode
  searchQuery?: string
  onSelectPath: (path: string) => void
}

const typeColors: Record<JsonNode['type'], string> = {
  string: 'bg-green-900/30 text-green-400',
  number: 'bg-amber-900/30 text-amber-400',
  boolean: 'bg-blue-900/30 text-blue-400',
  null: 'bg-red-900/30 text-red-400',
  object: 'bg-purple-900/30 text-purple-400',
  array: 'bg-indigo-900/30 text-indigo-400',
}

const valueColors: Record<string, string> = {
  string: 'text-green-400',
  number: 'text-amber-400',
  boolean: 'text-blue-400',
  null: 'text-red-400',
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query) return text
  const lower = text.toLowerCase()
  const idx = lower.indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-800 text-yellow-200 rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
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
        className="flex items-center gap-1.5 py-0.5 px-1 rounded hover:bg-white/5 cursor-pointer group"
        onClick={() => onSelectPath(node.path)}
      >
        {hasChildren ? (
          <button
            type="button"
            className="w-4 h-4 flex items-center justify-center text-zinc-500 hover:text-zinc-300 flex-shrink-0"
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

        <span className="font-semibold text-sm text-zinc-200">
          {highlightText(node.key, searchQuery ?? '')}
        </span>

        <span className={`text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${typeColors[node.type]}`}>
          {node.type}
        </span>

        {hasChildren ? (
          <span className="text-xs text-zinc-500">
            {node.type === 'object' ? `{${childCount} key${childCount !== 1 ? 's' : ''}}` : `[${childCount} item${childCount !== 1 ? 's' : ''}]`}
          </span>
        ) : (
          <span className={`text-sm font-mono truncate ${valueColors[node.type] ?? 'text-zinc-400'}`}>
            {highlightText(formatValue(node.value, node.type), searchQuery ?? '')}
          </span>
        )}
      </div>

      {hasChildren && expanded && (
        <div className="ml-4 border-l border-zinc-800 pl-2">
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

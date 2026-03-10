import { useMemo, useEffect, useRef } from 'react'

interface SyntaxHighlightProps {
  json: string
  highlightLine?: number
}

interface Token {
  text: string
  type: 'key' | 'string' | 'number' | 'boolean' | 'null' | 'structural' | 'whitespace'
}

const tokenRegex = /("(?:[^"\\]|\\.)*")\s*(:)|("(?:[^"\\]|\\.)*")|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|(\btrue\b|\bfalse\b)|(\bnull\b)|([{}[\]:,])|([ \t\n\r]+)/g

function tokenize(json: string): Token[] {
  const tokens: Token[] = []
  let lastIndex = 0

  let match: RegExpExecArray | null
  tokenRegex.lastIndex = 0

  while ((match = tokenRegex.exec(json)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ text: json.slice(lastIndex, match.index), type: 'whitespace' })
    }

    if (match[1] !== undefined) {
      tokens.push({ text: match[1], type: 'key' })
      tokens.push({ text: match[2], type: 'structural' })
    } else if (match[3] !== undefined) {
      tokens.push({ text: match[3], type: 'string' })
    } else if (match[4] !== undefined) {
      tokens.push({ text: match[4], type: 'number' })
    } else if (match[5] !== undefined) {
      tokens.push({ text: match[5], type: 'boolean' })
    } else if (match[6] !== undefined) {
      tokens.push({ text: match[6], type: 'null' })
    } else if (match[7] !== undefined) {
      tokens.push({ text: match[7], type: 'structural' })
    } else if (match[8] !== undefined) {
      tokens.push({ text: match[8], type: 'whitespace' })
    }

    lastIndex = tokenRegex.lastIndex
  }

  if (lastIndex < json.length) {
    tokens.push({ text: json.slice(lastIndex), type: 'whitespace' })
  }

  return tokens
}

const colorMap: Record<Token['type'], string> = {
  key: 'text-accent-red',
  string: 'text-green-400',
  number: 'text-amber-400',
  boolean: 'text-blue-400',
  null: 'text-red-400',
  structural: 'text-zinc-500',
  whitespace: '',
}

function groupTokensByLine(tokens: Token[]): Token[][] {
  const lines: Token[][] = [[]]
  for (const token of tokens) {
    if (token.type === 'whitespace' && token.text.includes('\n')) {
      const parts = token.text.split('\n')
      if (parts[0]) lines[lines.length - 1].push({ text: parts[0], type: 'whitespace' })
      for (let i = 1; i < parts.length; i++) {
        lines.push([])
        if (parts[i]) lines[lines.length - 1].push({ text: parts[i], type: 'whitespace' })
      }
    } else {
      lines[lines.length - 1].push(token)
    }
  }
  return lines
}

export default function SyntaxHighlight({ json, highlightLine }: SyntaxHighlightProps): React.ReactElement {
  const tokens = useMemo(() => tokenize(json), [json])
  const lines = useMemo(() => groupTokensByLine(tokens), [tokens])
  const highlightRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (highlightLine !== undefined && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlightLine])

  return (
    <pre className="font-mono text-sm overflow-x-auto whitespace-pre">
      <code>
        {lines.map((lineTokens, lineIdx) => {
          const isHighlighted = lineIdx === highlightLine
          const content = lineTokens.map((token, i) => {
            const cls = colorMap[token.type]
            if (!cls) return <span key={i}>{token.text}</span>
            return <span key={i} className={cls}>{token.text}</span>
          })

          if (isHighlighted) {
            return (
              <span key={lineIdx} ref={highlightRef} className="bg-accent-red/20 rounded-sm">
                {content}
                {lineIdx < lines.length - 1 ? '\n' : ''}
              </span>
            )
          }
          return (
            <span key={lineIdx}>
              {content}
              {lineIdx < lines.length - 1 ? '\n' : ''}
            </span>
          )
        })}
      </code>
    </pre>
  )
}

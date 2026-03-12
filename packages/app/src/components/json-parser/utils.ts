import type { JsonNode, JsonStats, JsonValidationResult, SearchMatch } from './types'

export const LARGE_INPUT_THRESHOLD = 100 * 1024 // 100 KB

export function parseJson(input: string): JsonValidationResult {
  if (!input.trim()) {
    return { valid: false }
  }

  try {
    const data: unknown = JSON.parse(input)
    return { valid: true, data }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid JSON'
    const posMatch = /position\s+(\d+)/i.exec(message)
    let line: number | undefined
    let column: number | undefined

    if (posMatch) {
      const pos = parseInt(posMatch[1], 10)
      let currentLine = 1
      let currentCol = 1
      for (let i = 0; i < pos && i < input.length; i++) {
        if (input[i] === '\n') {
          currentLine++
          currentCol = 1
        } else {
          currentCol++
        }
      }
      line = currentLine
      column = currentCol
    }

    return { valid: false, error: { message, line, column } }
  }
}

function getType(value: unknown): JsonNode['type'] {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  const t = typeof value
  if (t === 'string') return 'string'
  if (t === 'number') return 'number'
  if (t === 'boolean') return 'boolean'
  return 'object'
}

export function buildTree(value: unknown, key: string, path: string, depth: number): JsonNode {
  const type = getType(value)

  if (type === 'object' && value !== null) {
    const obj = value as Record<string, unknown>
    const children = Object.keys(obj).map((k) =>
      buildTree(obj[k], k, `${path}.${k}`, depth + 1)
    )
    return { key, value, type, path, depth, children }
  }

  if (type === 'array') {
    const arr = value as unknown[]
    const children = arr.map((item, i) =>
      buildTree(item, String(i), `${path}[${i}]`, depth + 1)
    )
    return { key, value, type, path, depth, children }
  }

  return { key, value, type, path, depth }
}

export function computeStats(input: string, rootNode: JsonNode): JsonStats {
  const typeCounts: Record<JsonNode['type'], number> = {
    string: 0,
    number: 0,
    boolean: 0,
    null: 0,
    object: 0,
    array: 0,
  }
  let totalKeys = 0
  let maxDepth = 0
  const arrayLengths: Array<{ path: string; length: number }> = []

  function walk(node: JsonNode): void {
    typeCounts[node.type]++
    if (node.depth > maxDepth) maxDepth = node.depth

    if (node.type === 'object' && node.children) {
      totalKeys += node.children.length
      node.children.forEach(walk)
    } else if (node.type === 'array' && node.children) {
      arrayLengths.push({ path: node.path, length: node.children.length })
      node.children.forEach(walk)
    }
  }

  walk(rootNode)

  const sizeBytes = new Blob([input]).size
  let sizeFormatted: string
  if (sizeBytes < 1024) {
    sizeFormatted = `${sizeBytes} B`
  } else if (sizeBytes < 1024 * 1024) {
    sizeFormatted = `${(sizeBytes / 1024).toFixed(1)} KB`
  } else {
    sizeFormatted = `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return { totalKeys, maxDepth, typeCounts, sizeBytes, sizeFormatted, arrayLengths }
}

export function searchJson(node: JsonNode, query: string): SearchMatch[] {
  const matches: SearchMatch[] = []
  const lowerQuery = query.toLowerCase()

  function walk(n: JsonNode): void {
    if (n.key.toLowerCase().includes(lowerQuery)) {
      matches.push({ path: n.path, key: n.key, value: String(n.value), type: 'key' })
    }

    if (n.type !== 'object' && n.type !== 'array') {
      const valStr = String(n.value)
      if (valStr.toLowerCase().includes(lowerQuery)) {
        matches.push({ path: n.path, key: n.key, value: valStr, type: 'value' })
      }
    }

    if (n.children) {
      n.children.forEach(walk)
    }
  }

  walk(node)
  return matches
}

export function buildPathLineMap(data: unknown): Map<string, number> {
  const map = new Map<string, number>()
  let currentLine = 0

  function walk(value: unknown, path: string): void {
    if (value === null || typeof value !== 'object') {
      return
    }

    if (Array.isArray(value)) {
      if (value.length === 0) return
      currentLine++
      for (let i = 0; i < value.length; i++) {
        const childPath = `${path}[${i}]`
        map.set(childPath, currentLine)
        if (value[i] !== null && typeof value[i] === 'object') {
          walk(value[i], childPath)
          currentLine++
        } else {
          currentLine++
        }
      }
      return
    }

    const keys = Object.keys(value as Record<string, unknown>)
    if (keys.length === 0) return
    currentLine++
    for (const k of keys) {
      const v = (value as Record<string, unknown>)[k]
      const childPath = `${path}.${k}`
      map.set(childPath, currentLine)
      if (v !== null && typeof v === 'object') {
        walk(v, childPath)
        currentLine++
      } else {
        currentLine++
      }
    }
  }

  map.set('$', 0)
  walk(data, '$')
  return map
}

export function findKeyInInput(input: string, key: string, value: string, matchType: 'key' | 'value'): { start: number; end: number } | null {
  if (matchType === 'key') {
    const searchStr = `"${key}"`
    const idx = input.indexOf(searchStr)
    if (idx === -1) return null
    return { start: idx, end: idx + searchStr.length }
  }
  const searchStr = key ? `"${key}"` : value
  const keyIdx = input.indexOf(searchStr)
  if (keyIdx === -1) return null
  const valueStr = JSON.stringify(value)
  const searchStart = key ? keyIdx + searchStr.length : 0
  const valIdx = input.indexOf(valueStr, searchStart)
  if (valIdx !== -1) return { start: valIdx, end: valIdx + valueStr.length }
  const rawIdx = input.indexOf(value, searchStart)
  if (rawIdx !== -1) return { start: rawIdx, end: rawIdx + value.length }
  return { start: keyIdx, end: keyIdx + searchStr.length }
}

export function formatJson(data: unknown): string {
  return JSON.stringify(data, null, 2)
}

export function minifyJson(data: unknown): string {
  return JSON.stringify(data)
}

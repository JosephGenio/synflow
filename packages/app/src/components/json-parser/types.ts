export interface JsonNode {
  key: string
  value: unknown
  type: 'string' | 'number' | 'boolean' | 'null' | 'object' | 'array'
  path: string
  depth: number
  children?: JsonNode[]
}

export interface JsonStats {
  totalKeys: number
  maxDepth: number
  typeCounts: Record<JsonNode['type'], number>
  sizeBytes: number
  sizeFormatted: string
  arrayLengths: Array<{ path: string; length: number }>
}

export interface JsonValidationResult {
  valid: boolean
  data?: unknown
  error?: {
    message: string
    line?: number
    column?: number
  }
}

export type OutputTab = 'tree' | 'formatted' | 'minified'

export interface SearchMatch {
  path: string
  key: string
  value: string
  type: 'key' | 'value'
}

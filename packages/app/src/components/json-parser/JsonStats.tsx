import type { JsonStats } from './types'

interface JsonStatsProps {
  stats: JsonStats
}

const typeBarColors: Record<string, string> = {
  string: 'bg-green-500',
  number: 'bg-amber-500',
  boolean: 'bg-blue-500',
  null: 'bg-red-500',
  object: 'bg-purple-500',
  array: 'bg-indigo-500',
}

const typeDotColors: Record<string, string> = {
  string: 'bg-green-500',
  number: 'bg-amber-500',
  boolean: 'bg-blue-500',
  null: 'bg-red-500',
  object: 'bg-purple-500',
  array: 'bg-indigo-500',
}

export default function JsonStatsPanel({ stats }: JsonStatsProps): React.ReactElement {
  const totalValues = Object.values(stats.typeCounts).reduce((a, b) => a + b, 0)

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Statistics</h3>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <div className="text-xs text-gray-500 dark:text-gray-400">Size</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">{stats.sizeFormatted}</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <div className="text-xs text-gray-500 dark:text-gray-400">Total Keys</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">{stats.totalKeys}</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <div className="text-xs text-gray-500 dark:text-gray-400">Max Depth</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">{stats.maxDepth}</div>
        </div>
      </div>

      {totalValues > 0 && (
        <div className="mb-4">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Type Distribution</div>
          <div className="h-3 rounded-full overflow-hidden flex bg-gray-100 dark:bg-gray-700">
            {Object.entries(stats.typeCounts)
              .filter(([, count]) => count > 0)
              .map(([type, count]) => (
                <div
                  key={type}
                  className={`${typeBarColors[type]} transition-all`}
                  style={{ width: `${(count / totalValues) * 100}%` }}
                  title={`${type}: ${count}`}
                />
              ))}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
            {Object.entries(stats.typeCounts)
              .filter(([, count]) => count > 0)
              .map(([type, count]) => (
                <div key={type} className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                  <span className={`w-2 h-2 rounded-full ${typeDotColors[type]}`} />
                  <span>{type}</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {stats.arrayLengths.length > 0 && (
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Arrays</div>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {stats.arrayLengths.map((arr) => (
              <div key={arr.path} className="flex items-center justify-between text-xs">
                <span className="font-mono text-gray-600 dark:text-gray-400 truncate mr-2">{arr.path}</span>
                <span className="font-medium text-gray-800 dark:text-gray-200 flex-shrink-0">{arr.length} items</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

import fs from 'fs'
import path from 'path'
import { getPool, closePool } from './db'

const MIGRATIONS_DIR = path.resolve(__dirname, '..', 'migrations')

function getAppVersion(): string {
  const pkgPath = path.resolve(__dirname, '..', 'package.json')
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
  return pkg.version as string
}

function parseSection(content: string, section: 'UP' | 'DOWN'): string {
  const marker = `-- ${section}`
  const otherMarker = section === 'UP' ? '-- DOWN' : '-- UP'

  const start = content.indexOf(marker)
  if (start === -1) {
    throw new Error(`Missing "${marker}" section`)
  }

  const afterMarker = start + marker.length
  const end = content.indexOf(otherMarker, afterMarker)

  const sql = end === -1
    ? content.slice(afterMarker)
    : content.slice(afterMarker, end)

  return sql.trim()
}

function getMigrationFiles(): string[] {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.warn(`Migrations directory not found: ${MIGRATIONS_DIR}`)
    return []
  }

  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort((a, b) => {
      const numA = parseInt(a.split('-')[0], 10)
      const numB = parseInt(b.split('-')[0], 10)
      return numA - numB
    })
}

export async function runMigrations(): Promise<void> {
  const pool = await getPool()
  const version = getAppVersion()

  // Ensure migrations tracking table exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "_migrations" (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      app_version VARCHAR(20) NOT NULL,
      applied_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `)

  // Get already-applied migrations
  const { rows: applied } = await pool.query<{ filename: string }>(
    'SELECT filename FROM "_migrations" ORDER BY id'
  )
  const appliedSet = new Set(applied.map((r) => r.filename))

  const files = getMigrationFiles()
  const pending = files.filter((f) => !appliedSet.has(f))

  if (pending.length === 0) {
    console.log('No pending migrations')
    return
  }

  console.log(`Running ${pending.length} migration(s) (v${version})...`)

  for (const file of pending) {
    const filePath = path.join(MIGRATIONS_DIR, file)
    const content = fs.readFileSync(filePath, 'utf-8')
    const upSql = parseSection(content, 'UP')

    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query(upSql)
      await client.query(
        'INSERT INTO "_migrations" (filename, app_version) VALUES ($1, $2)',
        [file, version]
      )
      await client.query('COMMIT')
      console.log(`  Applied: ${file}`)
    } catch (err) {
      await client.query('ROLLBACK')
      const message = err instanceof Error ? err.message : String(err)
      console.error(`  Failed: ${file} — ${message}`)
      throw err
    } finally {
      client.release()
    }
  }

  console.log('All migrations applied')
}

export async function rollback(targetVersion: string): Promise<void> {
  const pool = await getPool()

  // Ensure migrations table exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "_migrations" (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      app_version VARCHAR(20) NOT NULL,
      applied_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `)

  // Get all migrations applied AFTER the target version (i.e. those to roll back)
  // We roll back every migration whose id is greater than the last migration applied at the target version
  const { rows: targetRows } = await pool.query<{ id: number }>(
    'SELECT id FROM "_migrations" WHERE app_version = $1 ORDER BY id DESC LIMIT 1',
    [targetVersion]
  )

  if (targetRows.length === 0) {
    // Target version not found — check if it's older than all migrations (roll back everything)
    const { rows: allVersions } = await pool.query<{ app_version: string }>(
      'SELECT DISTINCT app_version FROM "_migrations" ORDER BY app_version'
    )

    if (allVersions.length === 0) {
      console.log('No migrations to roll back')
      return
    }

    console.error(`Version "${targetVersion}" not found in migration history.`)
    console.error(`Available versions: ${allVersions.map((r) => r.app_version).join(', ')}`)
    throw new Error(`Unknown version: ${targetVersion}`)
  }

  const cutoffId = targetRows[0].id
  const { rows } = await pool.query<{ id: number; filename: string; app_version: string }>(
    'SELECT id, filename, app_version FROM "_migrations" WHERE id > $1 ORDER BY id DESC',
    [cutoffId]
  )

  if (rows.length === 0) {
    console.log(`Already at version ${targetVersion} — nothing to roll back`)
    return
  }

  console.log(`Rolling back ${rows.length} migration(s) to version ${targetVersion}...`)

  for (const row of rows) {
    const filePath = path.join(MIGRATIONS_DIR, row.filename)

    if (!fs.existsSync(filePath)) {
      throw new Error(`Migration file not found: ${row.filename}`)
    }

    const content = fs.readFileSync(filePath, 'utf-8')
    const downSql = parseSection(content, 'DOWN')

    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query(downSql)
      await client.query('DELETE FROM "_migrations" WHERE id = $1', [row.id])
      await client.query('COMMIT')
      console.log(`  Rolled back: ${row.filename} (was applied in v${row.app_version})`)
    } catch (err) {
      await client.query('ROLLBACK')
      const message = err instanceof Error ? err.message : String(err)
      console.error(`  Rollback failed: ${row.filename} — ${message}`)
      throw err
    } finally {
      client.release()
    }
  }

  console.log('Rollback complete')
}

// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2)

  const run = async (): Promise<void> => {
    try {
      if (args[0] === '--rollback') {
        if (!args[1]) {
          console.error('Usage: migrate --rollback <version>')
          console.error('Example: migrate --rollback 0.0.3')
          process.exit(1)
        }
        await rollback(args[1])
      } else {
        await runMigrations()
      }
    } finally {
      await closePool()
    }
  }

  run()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}

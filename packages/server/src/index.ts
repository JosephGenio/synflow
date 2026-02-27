import app from './app'
import { getPool, closePool } from './db'
import { Server } from 'http'
import { execSync } from 'child_process'

const PORT = Number(process.env.PORT ?? 3001)
const MAX_RETRIES = 15
const RETRY_DELAY_MS = 2000

let server: Server | null = null

function killProcessOnPort(port: number): void {
  try {
    if (process.platform === 'win32') {
      // Windows: find and kill process using the port
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf-8' })
      const lines = output.trim().split('\n')
      const pids = new Set<string>()

      for (const line of lines) {
        const parts = line.trim().split(/\s+/)
        if (parts.length > 0) {
          const pid = parts[parts.length - 1]
          if (pid && pid !== String(process.pid) && /^\d+$/.test(pid)) {
            pids.add(pid)
          }
        }
      }

      for (const pid of pids) {
        try {
          execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' })
          console.log(`⚠ Killed stale process ${pid} on port ${port}`)
        } catch {
          // Process already dead
        }
      }
    } else {
      // Unix/Linux/macOS: use lsof
      const output = execSync(`lsof -ti :${port}`, { encoding: 'utf-8' })
      const pids = output.trim().split('\n').filter((p) => p && p !== String(process.pid))

      for (const pid of pids) {
        try {
          execSync(`kill -9 ${pid}`, { stdio: 'ignore' })
          console.log(`⚠ Killed stale process ${pid} on port ${port}`)
        } catch {
          // Process already dead
        }
      }
    }
  } catch {
    // No process found on port or command failed
  }
}

function listen(attempt: number): void {
  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✓ Server listening on http://localhost:${PORT}`)
  })

  server.keepAliveTimeout = 65000
  server.headersTimeout = 66000

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      if (attempt === 0) {
        console.warn(`⚠ Port ${PORT} in use. Attempting to free it...`)
        killProcessOnPort(PORT)
        server?.close()
        server = null
        setTimeout(() => listen(attempt + 1), RETRY_DELAY_MS)
      } else if (attempt < MAX_RETRIES) {
        console.warn(`⚠ Retrying in ${RETRY_DELAY_MS / 1000}s (attempt ${attempt + 1}/${MAX_RETRIES})...`)
        server?.close()
        server = null
        setTimeout(() => listen(attempt + 1), RETRY_DELAY_MS)
      } else {
        console.error('✗ Server error: Could not bind to port after multiple retries', err)
        process.exit(1)
      }
    } else {
      console.error('✗ Server error:', err)
      process.exit(1)
    }
  })
}

async function start(): Promise<void> {
  try {
    await getPool()
    console.log('Connected to PostgreSQL database')
  } catch (err) {
    console.error('Failed to connect to database:', err)
    process.exit(1)
  }

  listen(0)
}

async function shutdown(): Promise<void> {
  console.log('\n↓ Shutting down gracefully...')

  if (server) {
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        console.warn('⚠ Forced shutdown after 10s timeout')
        resolve()
      }, 10000)

      server!.close(() => {
        clearTimeout(timeout)
        console.log('✓ Server closed')
        resolve()
      })
    })
    server = null
  }

  await closePool()
  console.log('✓ Database connection closed')
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

start()

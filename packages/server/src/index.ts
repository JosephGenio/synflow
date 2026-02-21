import app from './app'
import { getPool, closePool } from './db'

const PORT = Number(process.env.PORT ?? 3001)

async function start(): Promise<void> {
  try {
    await getPool()
    console.log('Connected to MSSQL database')
  } catch (err) {
    console.error('Failed to connect to database:', err)
    process.exit(1)
  }

  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`)
  })
}

process.on('SIGINT', async () => {
  await closePool()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await closePool()
  process.exit(0)
})

start()

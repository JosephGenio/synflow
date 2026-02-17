import express from 'express'
import cors from 'cors'

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/ping', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() })
})

app.get('/api/db-health', async (_req, res) => {
  try {
    const { getPool } = await import('./db')
    const pool = await getPool()
    const result = await pool.request().query('SELECT TOP 1 KeyUser FROM [User]')
    res.json({ ok: true, result: result.recordset })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(503).json({ ok: false, error: message })
  }
})

export default app

import express from 'express'
import cors from 'cors'

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/ping', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() })
})

export default app

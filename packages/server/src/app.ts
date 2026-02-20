import express, { Request, Response } from 'express'
import cors from 'cors'
import { getPool } from './db'

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/
const CONTACT_REGEX = /^\+63\d{10}$/

interface RegisterBody {
  firstName: string
  middleName: string
  lastName: string
  email: string
  contactNumber: string
}

function validateRegistration(body: RegisterBody): string[] {
  const errors: string[] = []
  const { firstName, middleName, lastName, email, contactNumber } = body

  if (!firstName || !firstName.trim()) {
    errors.push('First name is required')
  } else if (firstName.trim().length > 100) {
    errors.push('First name must be 100 characters or fewer')
  }

  if (!middleName || !middleName.trim()) {
    errors.push('Middle name is required')
  } else if (middleName.trim().length > 100) {
    errors.push('Middle name must be 100 characters or fewer')
  }

  if (!lastName || !lastName.trim()) {
    errors.push('Last name is required')
  } else if (lastName.trim().length > 100) {
    errors.push('Last name must be 100 characters or fewer')
  }

  if (!email || !email.trim()) {
    errors.push('Email is required')
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errors.push('Please enter a valid email address')
  } else if (email.trim().length > 255) {
    errors.push('Email must be 255 characters or fewer')
  }

  if (!contactNumber || !contactNumber.trim()) {
    errors.push('Contact number is required')
  } else if (!CONTACT_REGEX.test(contactNumber.trim())) {
    errors.push('Contact number must start with +63 followed by 10 digits')
  }

  return errors
}

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/ping', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() })
})

app.get('/api/db-health', async (_req, res) => {
  try {
    const pool = await getPool()
    const result = await pool.request().query('SELECT TOP 1 KeyUser FROM [User]')
    res.json({ ok: true, result: result.recordset })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(503).json({ ok: false, error: message })
  }
})

app.post('/api/register', async (req: Request, res: Response) => {
  const body = req.body as RegisterBody
  const errors = validateRegistration(body)

  if (errors.length > 0) {
    res.status(400).json({ ok: false, errors })
    return
  }

  try {
    const pool = await getPool()
    await pool.request()
      .input('firstName', body.firstName.trim())
      .input('middleName', body.middleName.trim())
      .input('lastName', body.lastName.trim())
      .input('email', body.email.trim())
      .input('contactNumber', body.contactNumber.trim())
      .query(`
        INSERT INTO [UserRegistration] (FirstName, MiddleName, LastName, Email, ContactNumber)
        VALUES (@firstName, @middleName, @lastName, @email, @contactNumber)
      `)

    res.status(201).json({ ok: true })
  } catch (err: unknown) {
    const sqlErr = err as { number?: number }
    if (sqlErr.number === 2627 || sqlErr.number === 2601) {
      res.status(409).json({ ok: false, error: 'Email already registered' })
      return
    }
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ ok: false, error: message })
  }
})

export default app

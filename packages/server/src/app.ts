import express, { Request, Response } from 'express'
import cors from 'cors'
import bcrypt from 'bcrypt'
import { getPool } from './db'
import { sendVerificationEmail, sendAccountCreatedEmail } from './email'

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
        INSERT INTO [UserRegistration] (FirstName, MiddleName, LastName, Email, ContactNumber, TokenExpiresAt)
        VALUES (@firstName, @middleName, @lastName, @email, @contactNumber, DATEADD(HOUR, 1, GETDATE()))
      `)

    // Retrieve the auto-generated verification token
    const tokenResult = await pool.request()
      .input('email', body.email.trim())
      .query('SELECT VerificationToken FROM [UserRegistration] WHERE Email = @email')
    const token = tokenResult.recordset[0]?.VerificationToken as string | undefined

    // Send verification email (non-blocking — don't fail registration if email fails)
    if (token) {
      sendVerificationEmail(body.email.trim(), body.firstName.trim(), token).catch((err) => {
        console.error('Failed to send verification email:', err)
      })
    }

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

app.get('/api/verify-email', async (req: Request, res: Response) => {
  const token = req.query.token as string | undefined

  if (!token) {
    res.status(400).json({ ok: false, error: 'Verification token is required' })
    return
  }

  try {
    const pool = await getPool()
    const result = await pool.request()
      .input('token', token)
      .query(`
        UPDATE [UserRegistration]
        SET IsVerified = 1
        WHERE VerificationToken = @token AND IsVerified = 0 AND TokenExpiresAt > GETDATE()
      `)

    if (result.rowsAffected[0] === 0) {
      // Check why it failed
      const existing = await pool.request()
        .input('token2', token)
        .query('SELECT IsVerified, PasswordHash, TokenExpiresAt FROM [UserRegistration] WHERE VerificationToken = @token2')
      const row = existing.recordset[0]

      if (!row) {
        // Token doesn't exist — may have already been moved to User table
        const userExists = await pool.request()
          .input('token3', token)
          .query('SELECT 1 as found FROM [User] u JOIN [UserSecurity] us ON u.KeyUser = us.KeyUser WHERE us.Username IS NOT NULL AND EXISTS (SELECT 1)')
        if (userExists.recordset.length > 0) {
          const appUrl = process.env.APP_URL ?? 'http://localhost:3000'
          res.redirect(`${appUrl}/?status=already-verified`)
          return
        }
        res.status(400).json({ ok: false, error: 'Invalid verification token' })
        return
      }

      if (row.TokenExpiresAt && new Date(row.TokenExpiresAt) <= new Date()) {
        res.status(400).json({ ok: false, error: 'Verification link has expired. Please register again.' })
        return
      }

      if (row.IsVerified && row.PasswordHash) {
        const appUrl = process.env.APP_URL ?? 'http://localhost:3000'
        res.redirect(`${appUrl}/?status=already-verified`)
        return
      }

      if (row.IsVerified) {
        // Already verified but no password yet — redirect to set password
        const appUrl = process.env.APP_URL ?? 'http://localhost:3000'
        res.redirect(`${appUrl}/?view=set-password&token=${token}`)
        return
      }

      res.status(400).json({ ok: false, error: 'Invalid verification token' })
      return
    }

    const appUrl = process.env.APP_URL ?? 'http://localhost:3000'
    res.redirect(`${appUrl}/?view=set-password&token=${token}`)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ ok: false, error: message })
  }
})

app.post('/api/set-password', async (req: Request, res: Response) => {
  const { token, password } = req.body as { token?: string; password?: string }

  if (!token || !password) {
    res.status(400).json({ ok: false, error: 'Token and password are required' })
    return
  }

  // Password strength validation
  const passwordErrors: string[] = []
  if (password.length < 8) {
    passwordErrors.push('Password must be at least 8 characters')
  }
  if (!/[A-Z]/.test(password)) {
    passwordErrors.push('Password must contain at least one uppercase letter')
  }
  if (!/[a-z]/.test(password)) {
    passwordErrors.push('Password must contain at least one lowercase letter')
  }
  if (!/\d/.test(password)) {
    passwordErrors.push('Password must contain at least one number')
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    passwordErrors.push('Password must contain at least one special character')
  }

  if (passwordErrors.length > 0) {
    res.status(400).json({ ok: false, errors: passwordErrors })
    return
  }

  try {
    const pool = await getPool()

    // Verify the token exists and user is verified but has no password yet
    const regResult = await pool.request()
      .input('token', token)
      .query(`
        SELECT FirstName, MiddleName, LastName, Email, ContactNumber
        FROM [UserRegistration]
        WHERE VerificationToken = @token AND IsVerified = 1 AND PasswordHash IS NULL
      `)

    if (regResult.recordset.length === 0) {
      res.status(400).json({ ok: false, error: 'Invalid token or password already set' })
      return
    }

    const reg = regResult.recordset[0]
    const hash = await bcrypt.hash(password, 12)

    // Move to User + UserSecurity in a transaction
    const transaction = pool.transaction()
    await transaction.begin()

    try {
      // Insert into User and get the new KeyUser
      const userInsert = await transaction.request()
        .input('first', reg.FirstName)
        .input('middle', reg.MiddleName)
        .input('last', reg.LastName)
        .input('email', reg.Email)
        .input('contactNumber', reg.ContactNumber)
        .query(`
          INSERT INTO [User] ([First], [Middle], [Last], Email, ContactNumber)
          OUTPUT INSERTED.KeyUser
          VALUES (@first, @middle, @last, @email, @contactNumber)
        `)

      const keyUser = userInsert.recordset[0].KeyUser as string

      // Insert into UserSecurity
      await transaction.request()
        .input('keyUser', keyUser)
        .input('username', reg.Email)
        .input('password', hash)
        .query(`
          INSERT INTO [UserSecurity] (KeyUser, UserName, Password, DtCreated, LastLogin)
          VALUES (@keyUser, @username, @password, SYSDATETIMEOFFSET(), SYSDATETIMEOFFSET())
        `)

      // Delete the staging registration record
      await transaction.request()
        .input('token', token)
        .query('DELETE FROM [UserRegistration] WHERE VerificationToken = @token')

      await transaction.commit()

      // Send confirmation email (non-blocking)
      sendAccountCreatedEmail(reg.Email, reg.FirstName).catch((err) => {
        console.error('Failed to send account created email:', err)
      })

      res.json({ ok: true })
    } catch (txErr) {
      await transaction.rollback()
      throw txErr
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ ok: false, error: message })
  }
})

export default app

import express, { Request, Response, NextFunction, Application } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { getPool } from './db'
import { sendVerificationEmail, sendAccountCreatedEmail, sendPasswordResetEmail } from './email'
import { burnerEmailRouter } from './routes/burnerEmail'

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

interface JwtPayload {
  keyUser: string
  email: string
  firstName: string
  lastName: string
}

interface LoginBody {
  username: string
  password: string
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set')
  }
  return secret
}

function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const token = (req.cookies as Record<string, string>)?.token

  if (!token) {
    res.status(401).json({ ok: false, error: 'Authentication required' })
    return
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload
    ;(req as Request & { user: JwtPayload }).user = decoded
    next()
  } catch {
    res.status(401).json({ ok: false, error: 'Invalid or expired token' })
    return
  }
}

const app: Application = express()
app.use(cors({
  origin: process.env.APP_URL ?? 'http://localhost:3000',
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())

app.use(burnerEmailRouter)

app.get('/api/ping', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() })
})

app.get('/api/health', async (_req, res) => {
  try {
    const pool = await getPool()
    await pool.query('SELECT NOW()')
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(503).json({ status: 'error', message })
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
    const result = await pool.query(
      `INSERT INTO "UserRegistration" ("First", "Middle", "Last", "Email", "ContactNumber", "TokenExpiresAt")
       VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '1 hour')
       RETURNING "VerificationToken"`,
      [body.firstName.trim(), body.middleName.trim(), body.lastName.trim(), body.email.trim(), body.contactNumber.trim()]
    )

    const token = result.rows[0]?.VerificationToken as string | undefined

    // Send verification email (non-blocking)
    if (token) {
      sendVerificationEmail(body.email.trim(), body.firstName.trim(), token).catch((err) => {
        console.error('Failed to send verification email:', err)
      })
    }

    res.status(201).json({ ok: true })
  } catch (err: unknown) {
    const pgErr = err as { code?: string }
    // PostgreSQL unique constraint violation
    if (pgErr.code === '23505') {
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
    const result = await pool.query(
      `UPDATE "UserRegistration"
       SET "IsVerified" = TRUE
       WHERE "VerificationToken" = $1 AND "IsVerified" = FALSE AND "TokenExpiresAt" > NOW()`,
      [token]
    )

    if (result.rowCount === 0) {
      // Check why it failed
      const existing = await pool.query(
        `SELECT "IsVerified", "PasswordHash", "TokenExpiresAt" FROM "UserRegistration" WHERE "VerificationToken" = $1`,
        [token]
      )
      const row = existing.rows[0]

      if (!row) {
        const appUrl = process.env.APP_URL ?? 'http://localhost:3000'
        res.redirect(`${appUrl}/?status=already-verified`)
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

    const regResult = await pool.query(
      `SELECT "First", "Middle", "Last", "Email", "ContactNumber"
       FROM "UserRegistration"
       WHERE "VerificationToken" = $1 AND "IsVerified" = TRUE AND "PasswordHash" IS NULL`,
      [token]
    )

    if (regResult.rows.length === 0) {
      res.status(400).json({ ok: false, error: 'Invalid token or password already set' })
      return
    }

    const reg = regResult.rows[0]
    const hash = await bcrypt.hash(password, 12)

    // Use transaction
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const userInsert = await client.query(
        `INSERT INTO "User" ("First", "Middle", "Last", "Email", "ContactNumber")
         VALUES ($1, $2, $3, $4, $5)
         RETURNING "KeyUser"`,
        [reg.First, reg.Middle, reg.Last, reg.Email, reg.ContactNumber]
      )

      const keyUser = userInsert.rows[0].KeyUser as string

      await client.query(
        `INSERT INTO "UserSecurity" ("KeyUser", "UserName", "Password", "DtCreated", "LastLogin")
         VALUES ($1, $2, $3, NOW(), NOW())`,
        [keyUser, reg.Email, hash]
      )

      await client.query(
        `DELETE FROM "UserRegistration" WHERE "VerificationToken" = $1`,
        [token]
      )

      await client.query('COMMIT')

      sendAccountCreatedEmail(reg.Email, reg.First).catch((err) => {
        console.error('Failed to send account created email:', err)
      })

      res.json({ ok: true })
    } catch (txErr) {
      await client.query('ROLLBACK')
      throw txErr
    } finally {
      client.release()
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ ok: false, error: message })
  }
})

app.post('/api/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body as { email?: string }

  if (!email || !email.trim()) {
    res.status(400).json({ ok: false, error: 'Email is required' })
    return
  }

  if (!EMAIL_REGEX.test(email.trim())) {
    res.status(400).json({ ok: false, error: 'Please enter a valid email address' })
    return
  }

  try {
    const pool = await getPool()

    const userResult = await pool.query(
      `SELECT "KeyUser", "First" FROM "User" WHERE "Email" = $1 LIMIT 1`,
      [email.trim()]
    )

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0]
      const keyUser = user.KeyUser as string
      const firstName = user.First as string

      const insertResult = await pool.query(
        `INSERT INTO "PasswordReset" ("KeyUser", "TokenExpiresAt")
         VALUES ($1, NOW() + INTERVAL '1 hour')
         RETURNING "ResetToken"`,
        [keyUser]
      )

      const resetToken = insertResult.rows[0].ResetToken as string

      sendPasswordResetEmail(email.trim(), firstName, resetToken).catch((err) => {
        console.error('Failed to send password reset email:', err)
      })
    }

    res.json({ ok: true, message: 'If an account exists with that email, a password reset link has been sent.' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ ok: false, error: message })
  }
})

app.post('/api/reset-password', async (req: Request, res: Response) => {
  const { token, password } = req.body as { token?: string; password?: string }

  if (!token || !password) {
    res.status(400).json({ ok: false, error: 'Token and password are required' })
    return
  }

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

    const resetResult = await pool.query(
      `SELECT "KeyUser"
       FROM "PasswordReset"
       WHERE "ResetToken" = $1 AND "IsUsed" = FALSE AND "TokenExpiresAt" > NOW()`,
      [token]
    )

    if (resetResult.rows.length === 0) {
      res.status(400).json({ ok: false, error: 'Invalid or expired reset link. Please request a new one.' })
      return
    }

    const keyUser = resetResult.rows[0].KeyUser as string
    const hash = await bcrypt.hash(password, 12)

    await pool.query(
      `UPDATE "UserSecurity" SET "Password" = $1 WHERE "KeyUser" = $2`,
      [hash, keyUser]
    )

    await pool.query(
      `UPDATE "PasswordReset" SET "IsUsed" = TRUE WHERE "ResetToken" = $1`,
      [token]
    )

    res.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ ok: false, error: message })
  }
})

app.post('/api/login', async (req: Request, res: Response) => {
  const { username, password } = req.body as LoginBody

  if (!username || !username.trim()) {
    res.status(400).json({ ok: false, error: 'Username is required' })
    return
  }
  if (!password) {
    res.status(400).json({ ok: false, error: 'Password is required' })
    return
  }

  try {
    const pool = await getPool()

    const secResult = await pool.query(
      `SELECT "KeyUser", "Password" FROM "UserSecurity" WHERE "UserName" = $1 LIMIT 1`,
      [username.trim()]
    )

    if (secResult.rows.length === 0) {
      res.status(401).json({ ok: false, error: 'Invalid username or password' })
      return
    }

    const secRow = secResult.rows[0]
    const storedHash = secRow.Password as string
    const keyUser = secRow.KeyUser as string

    const isMatch = await bcrypt.compare(password, storedHash)
    if (!isMatch) {
      res.status(401).json({ ok: false, error: 'Invalid username or password' })
      return
    }

    const userResult = await pool.query(
      `SELECT "First", "Last", "Email" FROM "User" WHERE "KeyUser" = $1 LIMIT 1`,
      [keyUser]
    )

    if (userResult.rows.length === 0) {
      res.status(500).json({ ok: false, error: 'User record not found' })
      return
    }

    const user = userResult.rows[0]

    await pool.query(
      `UPDATE "UserSecurity" SET "LastLogin" = NOW() WHERE "KeyUser" = $1`,
      [keyUser]
    )

    const payload: JwtPayload = {
      keyUser,
      email: user.Email as string,
      firstName: user.First as string,
      lastName: user.Last as string,
    }

    const token = jwt.sign(payload, getJwtSecret(), { expiresIn: '1h' })

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000,
      path: '/',
    })

    res.json({
      ok: true,
      user: {
        keyUser,
        email: user.Email,
        firstName: user.First,
        lastName: user.Last,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ ok: false, error: message })
  }
})

app.get('/api/me', authenticateToken, (req: Request, res: Response) => {
  const user = (req as Request & { user: JwtPayload }).user
  res.json({ ok: true, user })
})

app.post('/api/logout', (_req: Request, res: Response) => {
  res.clearCookie('token', { path: '/' })
  res.json({ ok: true })
})

export default app

import express, { Application, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { getPool } from './db'
import { sendVerificationEmail, sendAccountCreatedEmail, sendPasswordResetEmail } from './email'

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
  }
}

const app: Application = express()
app.use(cors({
  origin: process.env.APP_URL ?? 'http://localhost:3000',
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())

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

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() })
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

    // Look up user by email
    const userResult = await pool.request()
      .input('email', email.trim())
      .query('SELECT TOP 1 u.KeyUser, u.[First] FROM [User] u WHERE u.Email = @email')

    if (userResult.recordset.length > 0) {
      const user = userResult.recordset[0]
      const keyUser = user.KeyUser as string
      const firstName = user.First as string

      // Create password reset record
      const insertResult = await pool.request()
        .input('keyUser', keyUser)
        .query(`
          INSERT INTO [PasswordReset] (KeyUser, TokenExpiresAt)
          OUTPUT INSERTED.ResetToken
          VALUES (@keyUser, DATEADD(HOUR, 1, GETDATE()))
        `)

      const resetToken = insertResult.recordset[0].ResetToken as string

      // Send reset email (non-blocking)
      sendPasswordResetEmail(email.trim(), firstName, resetToken).catch((err) => {
        console.error('Failed to send password reset email:', err)
      })
    }

    // Always return success to prevent email enumeration
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

  // Password strength validation (same rules as set-password)
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

    // Verify the reset token is valid and not expired
    const resetResult = await pool.request()
      .input('token', token)
      .query(`
        SELECT pr.KeyUser
        FROM [PasswordReset] pr
        WHERE pr.ResetToken = @token AND pr.IsUsed = 0 AND pr.TokenExpiresAt > GETDATE()
      `)

    if (resetResult.recordset.length === 0) {
      res.status(400).json({ ok: false, error: 'Invalid or expired reset link. Please request a new one.' })
      return
    }

    const keyUser = resetResult.recordset[0].KeyUser as string
    const hash = await bcrypt.hash(password, 12)

    // Update password and mark token as used
    await pool.request()
      .input('keyUser', keyUser)
      .input('hash', hash)
      .query('UPDATE [UserSecurity] SET Password = @hash WHERE KeyUser = @keyUser')

    await pool.request()
      .input('token2', token)
      .query('UPDATE [PasswordReset] SET IsUsed = 1 WHERE ResetToken = @token2')

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

    const secResult = await pool.request()
      .input('username', username.trim())
      .query('SELECT TOP 1 KeyUser, Password FROM [UserSecurity] WHERE UserName = @username')

    if (secResult.recordset.length === 0) {
      res.status(401).json({ ok: false, error: 'Invalid username or password' })
      return
    }

    const secRow = secResult.recordset[0]
    const storedHash = secRow.Password as string
    const keyUser = secRow.KeyUser as string

    const isMatch = await bcrypt.compare(password, storedHash)
    if (!isMatch) {
      res.status(401).json({ ok: false, error: 'Invalid username or password' })
      return
    }

    const userResult = await pool.request()
      .input('keyUser', keyUser)
      .query('SELECT TOP 1 [First], [Last], Email FROM [User] WHERE KeyUser = @keyUser')

    if (userResult.recordset.length === 0) {
      res.status(500).json({ ok: false, error: 'User record not found' })
      return
    }

    const user = userResult.recordset[0]

    await pool.request()
      .input('keyUser2', keyUser)
      .query('UPDATE [UserSecurity] SET LastLogin = SYSDATETIMEOFFSET() WHERE KeyUser = @keyUser2')

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
      sameSite: 'strict',
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

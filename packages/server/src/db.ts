import { Pool } from 'pg'
import dotenv from 'dotenv'
import path from 'path'

// Resolve .env path correctly for both development (src) and production (dist)
const envPath = path.resolve(path.join(__dirname, '..', '..', '..'), '.env')
const result = dotenv.config({ path: envPath })
if (result.error && process.env.NODE_ENV !== 'production') {
  console.warn(`Warning: Could not load .env file from ${envPath}`)
}

const dbName = process.env.DB_NAME ?? 'synflow'

const config = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: dbName,
  connectionTimeoutMillis: 5000,
  query_timeout: 10000,
  idle_in_transaction_session_timeout: 30000,
}

let pool: Pool | null = null

export async function getPool(): Promise<Pool> {
  if (pool) return pool

  console.log(`Connecting to PostgreSQL at ${config.host}:${config.port}/${config.database}`)
  pool = new Pool(config)

  // Test connection with timeout
  try {
    const client = await pool.connect()
    try {
      await client.query('SELECT NOW()')
      console.log('PostgreSQL connection test successful')
    } finally {
      client.release()
    }
  } catch (err) {
    pool = null
    const message = err instanceof Error ? err.message : String(err)
    console.error(`PostgreSQL connection failed: ${message}`)
    throw err
  }

  // Create tables if they don't exist
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "UserRegistration" (
      "KeyUserRegistration" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "First" VARCHAR(50) NOT NULL,
      "Middle" VARCHAR(50) NOT NULL,
      "Last" VARCHAR(50) NOT NULL,
      "Email" VARCHAR(100) NOT NULL UNIQUE,
      "ContactNumber" VARCHAR(13) NOT NULL,
      "VerificationToken" UUID DEFAULT gen_random_uuid(),
      "IsVerified" BOOLEAN DEFAULT FALSE,
      "PasswordHash" VARCHAR(255),
      "TokenExpiresAt" TIMESTAMP
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "User" (
      "KeyUser" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "First" VARCHAR(50) NOT NULL,
      "Middle" VARCHAR(50) NOT NULL,
      "Last" VARCHAR(50) NOT NULL,
      "Email" VARCHAR(100) NOT NULL UNIQUE,
      "ContactNumber" VARCHAR(13)
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "UserSecurity" (
      "KeyUserSecurity" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "KeyUser" UUID NOT NULL REFERENCES "User"("KeyUser") ON DELETE CASCADE,
      "UserName" VARCHAR(50) NOT NULL,
      "Password" TEXT NOT NULL,
      "DtCreated" TIMESTAMP NOT NULL DEFAULT NOW(),
      "LastLogin" TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "PasswordReset" (
      "KeyPasswordReset" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "KeyUser" UUID NOT NULL REFERENCES "User"("KeyUser") ON DELETE CASCADE,
      "ResetToken" UUID DEFAULT gen_random_uuid(),
      "TokenExpiresAt" TIMESTAMP NOT NULL,
      "IsUsed" BOOLEAN DEFAULT FALSE
    )
  `)

  return pool
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
  }
}

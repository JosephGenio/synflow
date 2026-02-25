import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config({ path: '../../.env' })

const dbName = process.env.DB_NAME ?? 'synflow'

const config = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: dbName,
}

let pool: Pool | null = null

export async function getPool(): Promise<Pool> {
  if (pool) return pool

  pool = new Pool(config)

  // Test connection
  const client = await pool.connect()
  try {
    await client.query('SELECT NOW()')
  } finally {
    client.release()
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

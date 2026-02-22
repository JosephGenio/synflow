import sql from 'mssql'
import dotenv from 'dotenv'
import path from 'path'

// Load from env directory (development) or rely on environment variables (Docker)
const envPath = path.resolve(__dirname, '../../env/.env.development')
dotenv.config({ path: envPath })

const config: sql.config = {
  server: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 1433),
  user: process.env.DB_USER ?? 'sa',
  password: process.env.DB_PASSWORD ?? 'YourStrong!Passw0rd',
  database: process.env.DB_NAME ?? 'synflow',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
}

let pool: sql.ConnectionPool | null = null

export async function getPool(): Promise<sql.ConnectionPool> {
  if (pool) return pool

  // First connect to master to ensure our database exists
  const masterPool = await new sql.ConnectionPool({
    ...config,
    database: 'master',
  }).connect()

  const dbName = config.database ?? 'synflow'
  await masterPool.request().query(
    `IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = '${dbName}')
     CREATE DATABASE [${dbName}]`
  )
  await masterPool.close()

  // Now connect to the target database
  pool = await new sql.ConnectionPool(config).connect()

  // Ensure verification columns exist on UserRegistration
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('UserRegistration') AND name = 'VerificationToken')
      ALTER TABLE [UserRegistration] ADD VerificationToken UNIQUEIDENTIFIER DEFAULT NEWID()
  `)
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('UserRegistration') AND name = 'IsVerified')
      ALTER TABLE [UserRegistration] ADD IsVerified BIT DEFAULT 0
  `)
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('UserRegistration') AND name = 'PasswordHash')
      ALTER TABLE [UserRegistration] ADD PasswordHash NVARCHAR(255) NULL
  `)
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('UserRegistration') AND name = 'TokenExpiresAt')
      ALTER TABLE [UserRegistration] ADD TokenExpiresAt DATETIME2 NULL
  `)

  // Ensure permanent User and UserSecurity tables exist
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'User')
    CREATE TABLE [User] (
      KeyUser UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
      [First] VARCHAR(50) NOT NULL,
      [Middle] VARCHAR(50) NOT NULL,
      [Last] VARCHAR(50) NOT NULL,
      Email VARCHAR(100) NOT NULL UNIQUE,
      ContactNumber NVARCHAR(13) NULL
    )
  `)
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserSecurity')
    CREATE TABLE [UserSecurity] (
      KeyUserSecurity UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
      KeyUser UNIQUEIDENTIFIER NOT NULL REFERENCES [User](KeyUser),
      UserName VARCHAR(50) NOT NULL,
      Password TEXT NOT NULL,
      DtCreated DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
      LastLogin DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
    )
  `)

  // Ensure PasswordReset table exists
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PasswordReset')
    CREATE TABLE [PasswordReset] (
      KeyPasswordReset UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
      KeyUser UNIQUEIDENTIFIER NOT NULL REFERENCES [User](KeyUser),
      ResetToken UNIQUEIDENTIFIER DEFAULT NEWID(),
      TokenExpiresAt DATETIME2 NOT NULL,
      IsUsed BIT DEFAULT 0
    )
  `)

  return pool
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.close()
    pool = null
  }
}

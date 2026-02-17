import sql from 'mssql'
import dotenv from 'dotenv'

dotenv.config({ path: '../../.env' })

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
  return pool
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.close()
    pool = null
  }
}

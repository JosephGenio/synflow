import { getPool } from './db'

export async function cleanupExpiredMailboxes(): Promise<number> {
  const pool = await getPool()
  const result = await pool.query(
    `DELETE FROM "BurnerMailbox" WHERE "ExpiresAt" < NOW()`
  )
  return result.rowCount ?? 0
}

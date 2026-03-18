import { Router, Request, Response } from 'express'
import crypto from 'crypto'
// import rateLimit from 'express-rate-limit'
import { getPool } from '../db'

const router = Router()

const BURNER_EMAIL_DOMAIN = process.env.BURNER_EMAIL_DOMAIN ?? 'burner.synflo.space'
const MAILBOX_TTL_MINUTES = 60


// Disable for Development
// TODO: Apply environemt variables to bypass rate limut on dev. 
// const createMailboxLimiter = rateLimit({
//   windowMs: 60 * 60 * 1000,
//   max: 5,
//   standardHeaders: true,
//   legacyHeaders: false,
//   message: { ok: false, error: 'Too many mailboxes created. Please try again later.' },
// })

function generateAddress(): string {
  return `${crypto.randomBytes(4).toString('hex')}@${BURNER_EMAIL_DOMAIN}`
}

// POST /api/burner/mailbox — Generate a new temporary mailbox
// router.post('/api/burner/mailbox', createMailboxLimiter, async (_req: Request, res: Response) => {
router.post('/api/burner/mailbox', async (_req: Request, res: Response) => {
  try {
    const pool = await getPool()
    const address = generateAddress()

    const result = await pool.query(
      `INSERT INTO "BurnerMailbox" ("Address", "ExpiresAt")
       VALUES ($1, NOW() + INTERVAL '${MAILBOX_TTL_MINUTES} minutes')
       RETURNING "KeyMailbox", "Address", "SessionToken", "ExpiresAt"`,
      [address]
    )

    const row = result.rows[0]
    res.status(201).json({
      ok: true,
      mailbox: {
        keyMailbox: row.KeyMailbox,
        address: row.Address,
        sessionToken: row.SessionToken,
        expiresAt: row.ExpiresAt,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ ok: false, error: message })
  }
})

// GET /api/burner/mailbox/:sessionToken — Get mailbox info + all emails
router.get('/api/burner/mailbox/:sessionToken', async (req: Request, res: Response) => {
  try {
    const pool = await getPool()
    const { sessionToken } = req.params

    const mailboxResult = await pool.query(
      `SELECT "KeyMailbox", "Address", "ExpiresAt", "IsExpired",
              ("IsExpired" OR "ExpiresAt" <= NOW()) AS "Expired"
       FROM "BurnerMailbox"
       WHERE "SessionToken" = $1`,
      [sessionToken]
    )

    if (mailboxResult.rows.length === 0) {
      res.status(404).json({ ok: false, error: 'Mailbox not found' })
      return
    }

    const mailbox = mailboxResult.rows[0]

    if (mailbox.Expired) {
      res.status(410).json({ ok: false, error: 'Mailbox has expired' })
      return
    }

    const emailsResult = await pool.query(
      `SELECT "KeyEmail", "FromAddress", "FromName", "Subject", "TextBody", "HtmlBody", "ReceivedAt"
       FROM "BurnerEmail"
       WHERE "KeyMailbox" = $1
       ORDER BY "ReceivedAt" DESC`,
      [mailbox.KeyMailbox]
    )

    res.json({
      ok: true,
      mailbox: {
        address: mailbox.Address,
        expiresAt: mailbox.ExpiresAt,
      },
      emails: emailsResult.rows.map((row) => ({
        keyEmail: row.KeyEmail,
        from: row.FromAddress,
        fromName: row.FromName,
        subject: row.Subject,
        textBody: row.TextBody,
        htmlBody: row.HtmlBody,
        receivedAt: row.ReceivedAt,
      })),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ ok: false, error: message })
  }
})

// GET /api/burner/mailbox/:sessionToken/poll — Poll for new emails
router.get('/api/burner/mailbox/:sessionToken/poll', async (req: Request, res: Response) => {
  try {
    const pool = await getPool()
    const { sessionToken } = req.params
    const since = req.query.since as string | undefined

    const mailboxResult = await pool.query(
      `SELECT "KeyMailbox", "ExpiresAt", "IsExpired",
              ("IsExpired" OR "ExpiresAt" <= NOW()) AS "Expired"
       FROM "BurnerMailbox"
       WHERE "SessionToken" = $1`,
      [sessionToken]
    )

    if (mailboxResult.rows.length === 0) {
      res.status(404).json({ ok: false, error: 'Mailbox not found' })
      return
    }

    const mailbox = mailboxResult.rows[0]

    if (mailbox.Expired) {
      res.status(410).json({ ok: false, error: 'Mailbox has expired' })
      return
    }

    let query = `SELECT "KeyEmail", "FromAddress", "FromName", "Subject", "TextBody", "HtmlBody", "ReceivedAt"
                 FROM "BurnerEmail"
                 WHERE "KeyMailbox" = $1`
    const params: (string | Date)[] = [mailbox.KeyMailbox]

    if (since) {
      query += ` AND "ReceivedAt" > $2`
      params.push(new Date(since))
    }

    query += ` ORDER BY "ReceivedAt" DESC`

    const emailsResult = await pool.query(query, params)

    res.json({
      ok: true,
      emails: emailsResult.rows.map((row) => ({
        keyEmail: row.KeyEmail,
        from: row.FromAddress,
        fromName: row.FromName,
        subject: row.Subject,
        textBody: row.TextBody,
        htmlBody: row.HtmlBody,
        receivedAt: row.ReceivedAt,
      })),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ ok: false, error: message })
  }
})

// POST /api/burner/webhook/inbound — Brevo inbound email webhook
// Brevo sends { items: [email, ...] } where each email has To, From, Subject, RawTextBody, RawHtmlBody
router.post('/api/burner/webhook/inbound', async (req: Request, res: Response) => {
  try {
    const pool = await getPool()
    const payload = req.body as Record<string, unknown>

    // Brevo wraps emails in an "items" array
    const items = Array.isArray(payload.items) ? payload.items : [payload]
    let totalInserted = 0

    for (const body of items) {
      if (typeof body !== 'object' || body === null) continue
      const email = body as Record<string, unknown>

      // Extract recipients — Brevo sends To as an array of { Address, Name } objects
      const recipients: string[] = []
      if (Array.isArray(email.To)) {
        for (const recipient of email.To) {
          if (typeof recipient === 'object' && recipient !== null && 'Address' in recipient) {
            recipients.push(String((recipient as Record<string, unknown>).Address).toLowerCase())
          } else if (typeof recipient === 'string') {
            recipients.push(recipient.toLowerCase())
          }
        }
      } else if (typeof email.To === 'string') {
        recipients.push(email.To.toLowerCase())
      }

      if (recipients.length === 0) continue

      // Extract sender info
      let fromAddress = ''
      let fromName: string | null = null
      if (typeof email.From === 'object' && email.From !== null) {
        const from = email.From as Record<string, unknown>
        fromAddress = String(from.Address ?? from.Email ?? '').toLowerCase()
        fromName = from.Name ? String(from.Name) : null
      } else if (typeof email.From === 'string') {
        fromAddress = email.From.toLowerCase()
      }

      const subject = typeof email.Subject === 'string' ? email.Subject.slice(0, 500) : null
      const textBody = typeof email.RawTextBody === 'string' ? email.RawTextBody : null
      const htmlBody = typeof email.RawHtmlBody === 'string' ? email.RawHtmlBody : null

      // Look up active mailboxes for these recipients
      const mailboxResult = await pool.query(
        `SELECT "KeyMailbox", "Address"
         FROM "BurnerMailbox"
         WHERE LOWER("Address") = ANY($1) AND "ExpiresAt" > NOW() AND "IsExpired" = FALSE`,
        [recipients]
      )

      if (mailboxResult.rows.length === 0) continue

      // Insert email for each matching mailbox
      for (const mailbox of mailboxResult.rows) {
        await pool.query(
          `INSERT INTO "BurnerEmail" ("KeyMailbox", "FromAddress", "FromName", "Subject", "TextBody", "HtmlBody")
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [mailbox.KeyMailbox, fromAddress, fromName, subject, textBody, htmlBody]
        )
        totalInserted++
      }
    }

    res.json({ ok: true, received: totalInserted > 0 })
  } catch (err) {
    // Always return 200 to Brevo to prevent retries
    console.error('Webhook processing error:', err)
    res.json({ ok: true, received: false, reason: 'Processing error' })
  }
})

// DELETE /api/burner/mailbox/:sessionToken — Delete mailbox early
router.delete('/api/burner/mailbox/:sessionToken', async (req: Request, res: Response) => {
  try {
    const pool = await getPool()
    const { sessionToken } = req.params

    const result = await pool.query(
      `DELETE FROM "BurnerMailbox" WHERE "SessionToken" = $1`,
      [sessionToken]
    )

    if (result.rowCount === 0) {
      res.status(404).json({ ok: false, error: 'Mailbox not found' })
      return
    }

    res.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ ok: false, error: message })
  }
})

export { router as burnerEmailRouter }

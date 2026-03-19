import { useState, useEffect, useCallback, useRef } from 'react'
import { API_URL } from '../../config'

const API_BASE = `${API_URL}/api/burner`
const POLL_INTERVAL_MS = 5000
const SESSION_STORAGE_KEY = 'burner-mailbox-session'

export interface BurnerEmail {
  keyEmail: string
  from: string
  fromName: string | null
  subject: string | null
  textBody: string | null
  htmlBody: string | null
  receivedAt: string
}

interface MailboxState {
  address: string
  sessionToken: string
  expiresAt: string
}

interface UseMailboxReturn {
  mailbox: MailboxState | null
  emails: BurnerEmail[]
  isLoading: boolean
  isExpired: boolean
  error: string | null
  generate: () => Promise<void>
  deleteMailbox: () => Promise<void>
  timeLeft: string
}

function formatTimeLeft(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Expired'
  const minutes = Math.floor(diff / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`
}

export function useMailbox(): UseMailboxReturn {
  const [mailbox, setMailbox] = useState<MailboxState | null>(null)
  const [emails, setEmails] = useState<BurnerEmail[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isExpired, setIsExpired] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState('')
  const lastReceivedAt = useRef<string | null>(null)
  const pollInFlight = useRef(false)

  // Restore session from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!stored) return

    try {
      const parsed = JSON.parse(stored) as MailboxState
      if (new Date(parsed.expiresAt) <= new Date()) {
        sessionStorage.removeItem(SESSION_STORAGE_KEY)
        return
      }
      setMailbox(parsed)
    } catch {
      sessionStorage.removeItem(SESSION_STORAGE_KEY)
    }
  }, [])

  // Fetch all emails when mailbox is set/restored
  useEffect(() => {
    if (!mailbox) return

    async function fetchEmails(): Promise<void> {
      try {
        const res = await fetch(`${API_BASE}/mailbox/${mailbox!.sessionToken}`)
        if (res.status === 410) {
          setIsExpired(true)
          sessionStorage.removeItem(SESSION_STORAGE_KEY)
          return
        }
        if (!res.ok) return

        const data = await res.json() as { ok: boolean; emails: BurnerEmail[] }
        if (data.ok) {
          setEmails(data.emails)
          if (data.emails.length > 0) {
            lastReceivedAt.current = data.emails[0].receivedAt
          }
        }
      } catch {
        // Silently fail — polling will retry
      }
    }

    fetchEmails()
  }, [mailbox])

  // Countdown timer
  useEffect(() => {
    if (!mailbox || isExpired) return

    function tick(): void {
      const left = formatTimeLeft(mailbox!.expiresAt)
      setTimeLeft(left)
      if (left === 'Expired') {
        setIsExpired(true)
        sessionStorage.removeItem(SESSION_STORAGE_KEY)
      }
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [mailbox, isExpired])

  // Polling for new emails
  useEffect(() => {
    if (!mailbox || isExpired) return

    const interval = setInterval(async () => {
      if (pollInFlight.current) return
      pollInFlight.current = true

      try {
        const sinceParam = lastReceivedAt.current ? `?since=${encodeURIComponent(lastReceivedAt.current)}` : ''
        const res = await fetch(`${API_BASE}/mailbox/${mailbox.sessionToken}/poll${sinceParam}`)

        if (res.status === 410) {
          setIsExpired(true)
          sessionStorage.removeItem(SESSION_STORAGE_KEY)
          return
        }

        if (!res.ok) return

        const data = await res.json() as { ok: boolean; emails: BurnerEmail[] }
        if (data.ok && data.emails.length > 0) {
          setEmails((prev) => {
            const existingKeys = new Set(prev.map((e) => e.keyEmail))
            const newEmails = data.emails.filter((e) => !existingKeys.has(e.keyEmail))
            return [...newEmails, ...prev]
          })
          lastReceivedAt.current = data.emails[0].receivedAt
        }
      } catch {
        // Silently fail
      } finally {
        pollInFlight.current = false
      }
    }, POLL_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [mailbox, isExpired])

  const generate = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setIsExpired(false)
    setEmails([])
    lastReceivedAt.current = null

    try {
      const res = await fetch(`${API_BASE}/mailbox`, { method: 'POST' })
      const data = await res.json() as { ok: boolean; mailbox?: MailboxState; error?: string }

      if (!data.ok || !data.mailbox) {
        setError(data.error ?? 'Failed to generate mailbox')
        return
      }

      const state: MailboxState = {
        address: data.mailbox.address,
        sessionToken: data.mailbox.sessionToken,
        expiresAt: data.mailbox.expiresAt,
      }

      setMailbox(state)
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state))
    } catch {
      setError('Failed to connect to server')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const deleteMailbox = useCallback(async () => {
    if (!mailbox) return

    try {
      await fetch(`${API_BASE}/mailbox/${mailbox.sessionToken}`, { method: 'DELETE' })
    } catch {
      // Continue cleanup regardless
    }

    setMailbox(null)
    setEmails([])
    setIsExpired(false)
    setError(null)
    setTimeLeft('')
    lastReceivedAt.current = null
    sessionStorage.removeItem(SESSION_STORAGE_KEY)
  }, [mailbox])

  return { mailbox, emails, isLoading, isExpired, error, generate, deleteMailbox, timeLeft }
}

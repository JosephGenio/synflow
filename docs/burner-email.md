# Burner Email — Feature Documentation

## Overview

Burner Email is a disposable/temporary email tool built into Synflo. Users generate a random email address that can receive real emails for a limited time (1 hour). No authentication is required — the feature is fully anonymous.

**Use cases:** Testing sign-up flows, receiving one-time verification codes, keeping your real inbox clean, QA testing email templates.

---

## Architecture

### Why Not a Microservice?

The Burner Email feature lives inside the existing Express server (`packages/server`) as a separate route module rather than a standalone microservice. Reasons:

1. **No existing microservice infrastructure** — No message queue, service discovery, or container orchestration is in place. Standing up a separate service would require significant infrastructure work for a single feature.
2. **Shared database** — The feature uses the same PostgreSQL instance already running in Docker.
3. **Brevo already integrated** — The `@getbrevo/brevo` SDK is already a dependency for outbound email.
4. **Team size** — Solo/small team benefits more from a well-organized monolith than distributed services.

### Route Module Pattern

This feature introduces the first route module (`packages/server/src/routes/burnerEmail.ts`), establishing a pattern for future route extraction from the monolithic `app.ts`.

---

## Database Schema

### BurnerMailbox

| Column | Type | Description |
|--------|------|-------------|
| `KeyMailbox` | UUID (PK) | Auto-generated primary key |
| `Address` | VARCHAR(255) | Generated email address (unique) |
| `SessionToken` | UUID | Bearer token for anonymous mailbox access |
| `CreatedAt` | TIMESTAMP | When the mailbox was created |
| `ExpiresAt` | TIMESTAMP | When the mailbox expires (default: +1 hour) |
| `IsExpired` | BOOLEAN | Flag for cleanup tracking |

**Indexes:** `Address`, `SessionToken`, partial index on `ExpiresAt` where not expired.

### BurnerEmail

| Column | Type | Description |
|--------|------|-------------|
| `KeyEmail` | UUID (PK) | Auto-generated primary key |
| `KeyMailbox` | UUID (FK) | References `BurnerMailbox`, CASCADE on delete |
| `FromAddress` | VARCHAR(255) | Sender email address |
| `FromName` | VARCHAR(255) | Sender display name (nullable) |
| `Subject` | VARCHAR(500) | Email subject (nullable) |
| `TextBody` | TEXT | Plain text body (nullable) |
| `HtmlBody` | TEXT | HTML body (nullable) |
| `ReceivedAt` | TIMESTAMP | When the email was received |

**Migrations:** `5-create-burner-mailbox.sql` and `6-create-burner-email.sql` in `packages/server/migrations/`.

---

## API Reference

All endpoints are prefixed with `/api/burner`.

### POST `/api/burner/mailbox`

Generate a new temporary mailbox. Rate limited to 5 per IP per hour.

**Request:** No body required.

**Response (201):**
```json
{
  "ok": true,
  "mailbox": {
    "keyMailbox": "uuid",
    "address": "a1b2c3d4@burner.synflo.space",
    "sessionToken": "uuid",
    "expiresAt": "2025-01-01T01:00:00.000Z"
  }
}
```

### GET `/api/burner/mailbox/:sessionToken`

Get mailbox info and all received emails.

**Response (200):**
```json
{
  "ok": true,
  "mailbox": {
    "address": "a1b2c3d4@burner.synflo.space",
    "expiresAt": "2025-01-01T01:00:00.000Z"
  },
  "emails": [
    {
      "keyEmail": "uuid",
      "from": "sender@example.com",
      "fromName": "John Doe",
      "subject": "Welcome!",
      "textBody": "Hello...",
      "htmlBody": "<p>Hello...</p>",
      "receivedAt": "2025-01-01T00:05:00.000Z"
    }
  ]
}
```

**Response (410):** Mailbox has expired.
**Response (404):** Mailbox not found.

### GET `/api/burner/mailbox/:sessionToken/poll?since=ISO_TIMESTAMP`

Poll for new emails received after the `since` timestamp. Used by the frontend on a 5-second interval.

**Response (200):** Same `emails` array format as above, filtered to only new emails.

### POST `/api/burner/webhook/inbound`

Brevo inbound email webhook receiver. This endpoint always returns 200 to prevent Brevo retries.

**Request body:** Brevo's parsed email JSON payload (see Brevo Webhook Setup below).

**Response (200):**
```json
{ "ok": true, "received": true }
```

### DELETE `/api/burner/mailbox/:sessionToken`

Manually delete a mailbox and all its emails before expiry.

**Response (200):**
```json
{ "ok": true }
```

---

## Brevo Webhook Setup

Brevo handles receiving inbound emails and forwards them to your server via webhook.

### Step 1: Configure MX Records

Add MX records for your burner email domain (e.g., `burner.synflo.space`) pointing to Brevo's inbound servers. Consult Brevo's documentation for current MX record values.

```
burner.synflo.space.  MX  10  inbound-smtp.brevo.com.
```

### Step 2: Configure Webhook in Brevo Dashboard

1. Go to **Transactional > Settings > Inbound parsing** (or **Automation > Inbound**)
2. Add your domain (`burner.synflo.space`)
3. Set the webhook URL: `https://yourdomain.com/api/burner/webhook/inbound`
4. Select JSON format for the payload

### Step 3: Environment Variable

Add to your `.env`:
```
BURNER_EMAIL_DOMAIN=burner.synflo.space
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BURNER_EMAIL_DOMAIN` | `burner.synflo.space` | Domain for generated email addresses |

All other variables (DB, Brevo API key, etc.) are shared with the existing server configuration.

---

## Frontend Architecture

### Screen

`packages/app/src/tools/BurnerEmailScreen.tsx` — Main screen with two-panel layout:
- **Left panel (1/3):** Mailbox info, address with copy button, expiry countdown, generate/delete actions
- **Right panel (2/3):** Email inbox list with email detail view

### Components

- `packages/app/src/components/burner-email/useMailbox.ts` — Custom hook managing all mailbox state, API calls, polling, and session persistence
- `packages/app/src/components/burner-email/EmailDetail.tsx` — Email content viewer with sandboxed HTML rendering

### State Management

- Session token stored in `sessionStorage` (survives page refresh, not tab close)
- Polling every 5 seconds when mailbox is active
- Countdown timer updates every second
- Auto-detection of expired mailboxes

### Feature Flag

Controlled by `featureFlags.json`:
```json
{
  "tools": {
    "burnerEmail": true
  }
}
```

Route: `/tools/burner-email`

---

## Security

| Concern | Mitigation |
|---------|-----------|
| **Abuse / spam** | Rate limiting: 5 mailboxes per IP per hour via `express-rate-limit` |
| **XSS from email HTML** | Rendered in `<iframe sandbox="allow-same-origin">` — no script execution |
| **Address guessing** | `crypto.randomBytes(4)` = 8 hex chars (~4 billion combinations) |
| **CSRF** | Session token in `sessionStorage`, not cookies |
| **Large payloads** | Webhook route accepts max 1MB body |
| **Brevo webhook spoofing** | Validate expected payload structure; optionally verify shared secret header |

---

## Cleanup Strategy

Expired mailboxes are automatically deleted via a `setInterval` in the server's `start()` function:

- Runs every **10 minutes**
- Deletes all `BurnerMailbox` rows where `ExpiresAt < NOW()`
- `ON DELETE CASCADE` on `BurnerEmail` automatically removes associated emails
- Cleanup interval is cleared on graceful server shutdown

Implementation: `packages/server/src/cleanup.ts`

---

## File Inventory

### New Files
| File | Purpose |
|------|---------|
| `packages/server/migrations/5-create-burner-mailbox.sql` | BurnerMailbox table migration |
| `packages/server/migrations/6-create-burner-email.sql` | BurnerEmail table migration |
| `packages/server/src/routes/burnerEmail.ts` | API endpoints + webhook handler |
| `packages/server/src/cleanup.ts` | Expired mailbox cleanup function |
| `packages/app/src/tools/BurnerEmailScreen.tsx` | Main screen component |
| `packages/app/src/components/burner-email/useMailbox.ts` | Mailbox state management hook |
| `packages/app/src/components/burner-email/EmailDetail.tsx` | Email content viewer |
| `docs/burner-email.md` | This documentation |

### Modified Files
| File | Change |
|------|--------|
| `packages/server/src/app.ts` | Mounted `burnerEmailRouter` |
| `packages/server/src/index.ts` | Added cleanup interval |
| `packages/server/package.json` | Added `express-rate-limit` |
| `packages/app/src/App.tsx` | Added `burner-email` view routing |
| `packages/app/src/tools/toolsData.tsx` | Wired `onBurnerEmail` handler |
| `packages/app/src/HomeScreen.tsx` | Threaded `onBurnerEmail` prop |
| `packages/app/src/ToolsCollectionScreen.tsx` | Threaded `onBurnerEmail` prop |

---

## Testing

1. **Migrations:** Start the dev server (`pnpm dev:server`) — migrations auto-apply
2. **Generate mailbox:** `curl -X POST http://localhost:3001/api/burner/mailbox`
3. **Check inbox:** `curl http://localhost:3001/api/burner/mailbox/<sessionToken>`
4. **Simulate webhook:**
   ```bash
   curl -X POST http://localhost:3001/api/burner/webhook/inbound \
     -H "Content-Type: application/json" \
     -d '{
       "To": [{"Address": "a1b2c3d4@burner.synflo.space"}],
       "From": {"Address": "test@example.com", "Name": "Test Sender"},
       "Subject": "Test Email",
       "TextBody": "Hello from test",
       "HtmlBody": "<p>Hello from test</p>"
     }'
   ```
5. **Poll:** `curl http://localhost:3001/api/burner/mailbox/<sessionToken>/poll?since=2025-01-01T00:00:00Z`
6. **Delete:** `curl -X DELETE http://localhost:3001/api/burner/mailbox/<sessionToken>`
7. **Frontend:** Navigate to `http://localhost:3000/tools/burner-email`

---

## Future Improvements

- **Attachment support** — Store attachment metadata and binary blobs in a separate table
- **WebSocket** — Replace polling with real-time push notifications
- **Custom TTL** — Allow users to choose mailbox duration (15min, 1hr, 24hr)
- **Email forwarding** — Forward received emails to a real address
- **Multiple addresses** — Allow multiple active mailboxes per session

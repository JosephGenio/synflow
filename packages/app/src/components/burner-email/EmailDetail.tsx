import { useRef, useEffect } from 'react'
import type { BurnerEmail } from './useMailbox'

interface EmailDetailProps {
  email: BurnerEmail
  onBack: () => void
}

export default function EmailDetail({ email, onBack }: EmailDetailProps): React.ReactElement {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (!iframeRef.current || !email.htmlBody) return

    const doc = iframeRef.current.contentDocument
    if (!doc) return

    doc.open()
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              font-size: 14px;
              line-height: 1.6;
              color: #e4e4e7;
              background: transparent;
              margin: 0;
              padding: 0;
              word-wrap: break-word;
              overflow-wrap: break-word;
            }
            a { color: #a78bfa; }
            img { max-width: 100%; height: auto; }
          </style>
        </head>
        <body>${email.htmlBody}</body>
      </html>
    `)
    doc.close()
  }, [email.htmlBody])

  const date = new Date(email.receivedAt)
  const formattedDate = date.toLocaleString()

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-noir-border flex-shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
          aria-label="Back to inbox"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-medium text-zinc-300 truncate">Back to Inbox</span>
      </div>

      {/* Email Meta */}
      <div className="px-4 py-3 border-b border-noir-border flex-shrink-0 space-y-1">
        <h2 className="text-base font-semibold text-white truncate">{email.subject ?? '(No Subject)'}</h2>
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="font-medium text-zinc-300">{email.fromName ?? email.from}</span>
          {email.fromName && (
            <span className="text-zinc-500">&lt;{email.from}&gt;</span>
          )}
        </div>
        <div className="text-xs text-zinc-500">{formattedDate}</div>
      </div>

      {/* Email Body */}
      <div className="flex-1 min-h-0 overflow-auto">
        {email.htmlBody ? (
          <iframe
            ref={iframeRef}
            sandbox="allow-same-origin"
            title="Email content"
            className="w-full h-full border-0 bg-transparent"
          />
        ) : email.textBody ? (
          <pre className="p-4 text-sm text-zinc-300 whitespace-pre-wrap font-sans">{email.textBody}</pre>
        ) : (
          <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
            No content available
          </div>
        )}
      </div>
    </div>
  )
}

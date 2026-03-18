import { useState, useCallback } from 'react'
import { useMailbox } from '../components/burner-email/useMailbox'
import type { BurnerEmail } from '../components/burner-email/useMailbox'
import EmailDetail from '../components/burner-email/EmailDetail'
import Footer from '../components/Footer'

interface BurnerEmailScreenProps {
  onHome: () => void
}

export default function BurnerEmailScreen({ onHome }: BurnerEmailScreenProps): React.ReactElement {
  const { mailbox, emails, isLoading, isExpired, error, generate, deleteMailbox, timeLeft } = useMailbox()
  const [selectedEmail, setSelectedEmail] = useState<BurnerEmail | null>(null)
  const [copyFeedback, setCopyFeedback] = useState(false)

  const handleCopyAddress = useCallback(() => {
    if (!mailbox) return
    navigator.clipboard.writeText(mailbox.address).then(() => {
      setCopyFeedback(true)
      setTimeout(() => setCopyFeedback(false), 2000)
    })
  }, [mailbox])

  const actionBtnClass = 'text-xs px-2.5 py-1 rounded-md bg-white/5 border border-noir-border text-zinc-300 hover:bg-white/10 hover:text-white transition-colors'

  return (
    <div className="bg-black text-white font-inter flex flex-col selection-red">
      {/* Tool area — fills exactly one viewport */}
      <div className="h-screen flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-noir-border bg-black/60 backdrop-blur-xl px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onHome}
                className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
                aria-label="Back to home"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5" />
                  <path d="M12 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-accent-purple rounded-sm rotate-45" />
                <h1 className="text-lg font-semibold font-manrope tracking-tight">Burner Email</h1>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-4 p-4 lg:p-6 max-w-screen-2xl mx-auto flex-1 min-h-0 w-full">
          {/* Left: Mailbox Panel */}
          <div className="w-full lg:w-1/3 flex flex-col min-h-0">
            <div className="bg-noir-surface rounded-xl border border-noir-border flex flex-col overflow-hidden flex-1 min-h-0">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-noir-border flex-shrink-0">
                <span className="text-sm font-medium text-zinc-300">Mailbox</span>
                {mailbox && !isExpired && (
                  <span className="text-xs font-mono text-zinc-500">{timeLeft}</span>
                )}
              </div>

              <div className="flex-1 p-4 flex flex-col gap-4 min-h-0">
                {/* No mailbox — initial state */}
                {!mailbox && !isExpired && (
                  <div className="flex-1 flex flex-col items-center justify-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-accent-purple/10 flex items-center justify-center">
                      <svg className="w-8 h-8 text-accent-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="20" height="16" x="2" y="4" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-zinc-300 font-medium">Temporary Email</p>
                      <p className="text-xs text-zinc-500 mt-1">Generate a disposable email address to receive emails for 1 hour.</p>
                    </div>
                    <button
                      type="button"
                      onClick={generate}
                      disabled={isLoading}
                      className="px-4 py-2 rounded-lg bg-accent-purple text-white text-sm font-medium hover:bg-purple-600 transition-colors disabled:opacity-50"
                    >
                      {isLoading ? 'Generating...' : 'Generate Email'}
                    </button>
                    {error && (
                      <p className="text-xs text-red-400">{error}</p>
                    )}
                  </div>
                )}

                {/* Expired state */}
                {isExpired && (
                  <div className="flex-1 flex flex-col items-center justify-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-red-900/20 flex items-center justify-center">
                      <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-zinc-300 font-medium">Mailbox Expired</p>
                      <p className="text-xs text-zinc-500 mt-1">This temporary email has expired. Generate a new one to continue.</p>
                    </div>
                    <button
                      type="button"
                      onClick={generate}
                      disabled={isLoading}
                      className="px-4 py-2 rounded-lg bg-accent-purple text-white text-sm font-medium hover:bg-purple-600 transition-colors disabled:opacity-50"
                    >
                      {isLoading ? 'Generating...' : 'Generate New Email'}
                    </button>
                  </div>
                )}

                {/* Active mailbox */}
                {mailbox && !isExpired && (
                  <>
                    {/* Address display */}
                    <div className="bg-white/5 rounded-lg border border-noir-border p-3">
                      <div className="text-xs text-zinc-500 mb-1">Your temporary email</div>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono text-accent-purple flex-1 truncate">{mailbox.address}</code>
                        <button
                          type="button"
                          onClick={handleCopyAddress}
                          className={actionBtnClass}
                        >
                          {copyFeedback ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={generate}
                        disabled={isLoading}
                        className={`flex-1 ${actionBtnClass} text-center`}
                      >
                        New Address
                      </button>
                      <button
                        type="button"
                        onClick={deleteMailbox}
                        className="flex-1 text-xs px-2.5 py-1 rounded-md bg-red-900/20 border border-red-800/50 text-red-400 hover:bg-red-900/40 hover:text-red-300 transition-colors text-center"
                      >
                        Delete
                      </button>
                    </div>

                    {/* Info */}
                    <div className="text-xs text-zinc-500 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      Checking for new emails every 5 seconds
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Inbox Panel */}
          <div className="w-full lg:w-2/3 flex flex-col min-h-0">
            <div className="bg-noir-surface rounded-xl border border-noir-border flex flex-col overflow-hidden flex-1 min-h-0">
              {selectedEmail ? (
                <EmailDetail
                  email={selectedEmail}
                  onBack={() => setSelectedEmail(null)}
                />
              ) : (
                <>
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-noir-border flex-shrink-0">
                    <span className="text-sm font-medium text-zinc-300">Inbox</span>
                    {emails.length > 0 && (
                      <span className="text-xs text-zinc-500">{emails.length} email{emails.length !== 1 ? 's' : ''}</span>
                    )}
                  </div>

                  <div className="flex-1 overflow-auto min-h-0">
                    {emails.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full gap-2 text-zinc-500">
                        <svg className="w-10 h-10 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 12h-6l-2 3h-4l-2-3H2" />
                          <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
                        </svg>
                        <span className="text-sm">
                          {mailbox && !isExpired ? 'Waiting for emails...' : 'Generate an email to get started'}
                        </span>
                      </div>
                    ) : (
                      <ul className="divide-y divide-noir-border">
                        {emails.map((email) => (
                          <li key={email.keyEmail}>
                            <button
                              type="button"
                              onClick={() => setSelectedEmail(email)}
                              className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors"
                            >
                              <div className="flex items-center justify-between gap-2 mb-0.5">
                                <span className="text-sm font-medium text-zinc-200 truncate">
                                  {email.fromName ?? email.from}
                                </span>
                                <span className="text-xs text-zinc-500 flex-shrink-0">
                                  {new Date(email.receivedAt).toLocaleTimeString()}
                                </span>
                              </div>
                              <div className="text-sm text-zinc-400 truncate">
                                {email.subject ?? '(No Subject)'}
                              </div>
                              {email.textBody && (
                                <div className="text-xs text-zinc-600 truncate mt-0.5">
                                  {email.textBody.slice(0, 100)}
                                </div>
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}

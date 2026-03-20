import featureFlags from '../featureFlags'

/* ── Icons ── */

function BracesIcon(): React.ReactElement {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1" />
      <path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1" />
    </svg>
  )
}

function DiffIcon(): React.ReactElement {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v14" />
      <path d="M5 10h14" />
      <path d="M5 21h14" />
    </svg>
  )
}

function HashIcon(): React.ReactElement {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" x2="20" y1="9" y2="9" />
      <line x1="4" x2="20" y1="15" y2="15" />
      <line x1="10" x2="8" y1="3" y2="21" />
      <line x1="16" x2="14" y1="3" y2="21" />
    </svg>
  )
}

function MailIcon(): React.ReactElement {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

function ShieldIcon(): React.ReactElement {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  )
}

function RegexIcon(): React.ReactElement {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3v10" />
      <path d="m12.67 5.5 8.66 5" />
      <path d="m12.67 10.5 8.66-5" />
      <path d="M9 17a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2z" />
    </svg>
  )
}

function ImageIcon(): React.ReactElement {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  )
}

/* ── Tool collection data ── */

interface ToolItem {
  icon: React.ReactNode
  title: string
  description: string
  accentColor: string
  onClick?: () => void
  comingSoon: boolean
}

interface ToolCollection {
  label: string
  description: string
  tools: ToolItem[]
}

interface ToolHandlers {
  onJsonParser?: () => void
  onBurnerEmail?: () => void
}

export function getToolCollections(handlers: ToolHandlers): ToolCollection[] {
  return [
    {
      label: 'Data & Parsing',
      description: 'Parse, compare, and transform structured data.',
      tools: [
        {
          icon: <BracesIcon />,
          title: 'JSON Parser',
          description: 'Paste, parse, and explore JSON with syntax highlighting, tree navigation, search, and real-time validation.',
          accentColor: 'var(--color-accent-red)',
          onClick: handlers.onJsonParser,
          comingSoon: !featureFlags.tools.jsonParser,
        },
        {
          icon: <DiffIcon />,
          title: 'Diff Checker',
          description: 'Compare two blocks of text or code side-by-side with highlighted additions, deletions, and changes.',
          accentColor: 'var(--color-accent-amber)',
          comingSoon: !featureFlags.tools.diffChecker,
        },
        {
          icon: <HashIcon />,
          title: 'Encoder / Decoder',
          description: 'Base64, URL encoding, HTML entities — encode and decode strings in every common format.',
          accentColor: 'var(--color-accent-cyan)',
          comingSoon: !featureFlags.tools.encoderDecoder,
        },
        {
          icon: <ImageIcon />,
          title: 'Image Optimizer',
          description: 'Compress, resize, and convert images to multiple formats while maintaining quality. WebP, JPEG, PNG, and more.',
          accentColor: 'var(--color-accent-orange)',
          comingSoon: !featureFlags.tools.imageOptimizer,
        },
      ],
    },
    {
      label: 'Privacy & Identity',
      description: 'Disposable identities and security utilities for testing and development.',
      tools: [
        {
          icon: <MailIcon />,
          title: 'Burner Email',
          description: 'Generate temporary email addresses for sign-up flows, testing, and keeping your inbox clean.',
          accentColor: 'var(--color-accent-purple)',
          onClick: handlers.onBurnerEmail,
          comingSoon: !featureFlags.tools.burnerEmail,
        },
        {
          icon: <ShieldIcon />,
          title: 'Password Generator',
          description: 'Create strong, random passwords with customizable length, character sets, and entropy display.',
          accentColor: 'var(--color-accent-green)',
          comingSoon: !featureFlags.tools.passwordGenerator,
        },
      ],
    },
    {
      label: 'Text & Code',
      description: 'Format, test, and preview text and code snippets.',
      tools: [
        {
          icon: <RegexIcon />,
          title: 'Regex Tester',
          description: 'Write and test regular expressions with real-time match highlighting and group extraction.',
          accentColor: 'var(--color-accent-blue)',
          comingSoon: !featureFlags.tools.regexTester,
        },
      ],
    },
  ]
}

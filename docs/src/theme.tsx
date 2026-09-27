import { useEffect, useState, type ReactNode } from 'react'

type Theme = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'inlay-docs-theme'

function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // Storage can be unavailable in private windows.
  }
  return 'system'
}

function applyTheme(theme: Theme): void {
  const root = document.documentElement
  if (theme === 'system') delete root.dataset.theme
  else root.dataset.theme = theme
  try {
    if (theme === 'system') localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Ignore; the choice simply won't persist.
  }
}

const OPTIONS: Array<{ value: Theme; label: string; icon: ReactNode }> = [
  {
    value: 'system',
    label: 'System theme',
    icon: <path d="M2.5 3.5h11v7h-11zM6 13h4M8 10.5V13" />,
  },
  {
    value: 'light',
    label: 'Light theme',
    icon: (
      <>
        <circle cx="8" cy="8" r="2.75" />
        <path d="M8 1.75v1.5M8 12.75v1.5M1.75 8h1.5M12.75 8h1.5M3.6 3.6l1 1M11.4 11.4l1 1M3.6 12.4l1-1M11.4 4.6l1-1" />
      </>
    ),
  },
  {
    value: 'dark',
    label: 'Dark theme',
    icon: <path d="M13 9.5A5.5 5.5 0 016.5 3a5.5 5.5 0 106.5 6.5z" />,
  },
]

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(readStoredTheme)
  useEffect(() => applyTheme(theme), [theme])

  return (
    <div className="theme-toggle" role="radiogroup" aria-label="Theme">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={theme === option.value}
          aria-label={option.label}
          title={option.label}
          onClick={() => setTheme(option.value)}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            {option.icon}
          </svg>
        </button>
      ))}
    </div>
  )
}

import type { CSSProperties } from 'react'

const THEME_VARIABLES = [
  '--inlay-font',
  '--inlay-font-mono',
  '--inlay-font-size',
  '--inlay-bg',
  '--inlay-fg',
  '--inlay-muted',
  '--inlay-faint',
  '--inlay-border',
  '--inlay-border-strong',
  '--inlay-hover',
  '--inlay-selected',
  '--inlay-accent',
  '--inlay-accent-fg',
  '--inlay-focus',
  '--inlay-danger',
  '--inlay-popover-bg',
  '--inlay-popover-shadow',
  '--inlay-radius',
  '--inlay-radius-sm',
  '--inlay-token-bg',
  '--inlay-token-fg',
  '--inlay-token-selected',
]

/**
 * Popovers render in `document.body`, outside any themed ancestor. Copy
 * the composer's resolved tokens so per-instance themes carry over.
 */
export function readThemeVariables(
  element: HTMLElement | null
): CSSProperties | undefined {
  if (!element || typeof window === 'undefined') return undefined
  const computed = window.getComputedStyle(element)
  const style: Record<string, string> = {}
  for (const name of THEME_VARIABLES) {
    const value = computed.getPropertyValue(name).trim()
    if (value) style[name] = value
  }
  const scheme = computed.colorScheme
  if (scheme && scheme !== 'normal') style.colorScheme = scheme
  return style
}

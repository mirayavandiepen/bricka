import type { CSSProperties } from 'react'

const THEME_VARIABLES = [
  '--bricka-font',
  '--bricka-font-mono',
  '--bricka-font-size',
  '--bricka-bg',
  '--bricka-fg',
  '--bricka-muted',
  '--bricka-faint',
  '--bricka-border',
  '--bricka-border-strong',
  '--bricka-hover',
  '--bricka-selected',
  '--bricka-accent',
  '--bricka-accent-fg',
  '--bricka-focus',
  '--bricka-danger',
  '--bricka-popover-bg',
  '--bricka-popover-shadow',
  '--bricka-radius',
  '--bricka-radius-sm',
  '--bricka-token-bg',
  '--bricka-token-fg',
  '--bricka-token-selected',
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

import type { KeyboardEvent } from 'react'

export function isApplePlatform(): boolean {
  if (typeof navigator === 'undefined') return false
  return /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent)
}

/** True when `mod` (⌘ on Apple platforms, Ctrl elsewhere) is held. */
export function isModKey(
  event: KeyboardEvent | globalThis.KeyboardEvent
): boolean {
  return isApplePlatform() ? event.metaKey : event.ctrlKey
}

/** Match shortcuts such as `mod+k`, `ctrl+shift+p` or `alt+/`. */
export function matchesShortcut(
  event: KeyboardEvent | globalThis.KeyboardEvent,
  shortcut: string
): boolean {
  const parts = shortcut.toLowerCase().split('+')
  const key = parts.pop()
  if (!key || event.key.toLowerCase() !== key) return false

  const isApple = isApplePlatform()
  const wants = {
    meta: parts.includes('meta') || (isApple && parts.includes('mod')),
    ctrl: parts.includes('ctrl') || (!isApple && parts.includes('mod')),
    shift: parts.includes('shift'),
    alt: parts.includes('alt'),
  }
  return (
    event.metaKey === wants.meta &&
    event.ctrlKey === wants.ctrl &&
    event.shiftKey === wants.shift &&
    event.altKey === wants.alt
  )
}

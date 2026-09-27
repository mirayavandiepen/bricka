import type { Rect } from './caret'

export type MenuPlacement = 'below' | 'above'

export type MenuPosition = {
  /** For `above`, the menu's bottom edge; render with translateY(-100%). */
  top: number
  left: number
  width: number
  maxHeight: number
  placement: MenuPlacement
}

const WIDTH = 320
const MARGIN = 8
const GAP = 6
const MAX_HEIGHT = 320
const MIN_USABLE_HEIGHT = 160

/** Visible viewport in layout-viewport coordinates (what `fixed` uses). */
export function getViewport(): Rect {
  const visual = window.visualViewport
  const top = visual?.offsetTop ?? 0
  const left = visual?.offsetLeft ?? 0
  const width = visual?.width ?? window.innerWidth
  const height = visual?.height ?? window.innerHeight
  return {
    top,
    left,
    width,
    height,
    right: left + width,
    bottom: top + height,
  }
}

/**
 * Place the menu next to the trigger character. The placement sticks
 * while it still fits, so the menu does not flip as results change.
 */
export function computeMenuPosition(
  anchor: Rect,
  viewport: Rect,
  previous?: MenuPlacement
): MenuPosition {
  const width = Math.max(0, Math.min(WIDTH, viewport.width - MARGIN * 2))
  const left = Math.min(
    Math.max(anchor.left - 4, viewport.left + MARGIN),
    viewport.right - MARGIN - width
  )
  const below = viewport.bottom - anchor.bottom - GAP - MARGIN
  const above = anchor.top - viewport.top - GAP - MARGIN

  let placement: MenuPlacement
  if (previous === 'above' && above >= MIN_USABLE_HEIGHT) placement = 'above'
  else if (below >= MIN_USABLE_HEIGHT || below >= above) placement = 'below'
  else placement = 'above'

  const space = placement === 'below' ? below : above
  return {
    top: placement === 'below' ? anchor.bottom + GAP : anchor.top - GAP,
    left,
    width,
    maxHeight: Math.max(0, Math.min(MAX_HEIGHT, space)),
    placement,
  }
}

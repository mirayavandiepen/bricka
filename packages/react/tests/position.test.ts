import { describe, expect, it } from 'vitest'
import type { Rect } from '../src/editor/caret'
import { computeMenuPosition } from '../src/editor/position'

function rect(top: number, left: number, width = 8, height = 20): Rect {
  return { top, left, width, height, right: left + width, bottom: top + height }
}

const viewport = rect(0, 0, 1024, 768)

describe('computeMenuPosition', () => {
  it('opens below the trigger with a gap and a height cap', () => {
    const position = computeMenuPosition(rect(100, 200), viewport)
    expect(position).toMatchObject({
      placement: 'below',
      top: 126,
      left: 196,
      width: 320,
      maxHeight: 320,
    })
  })

  it('flips above when there is not enough room below', () => {
    const position = computeMenuPosition(rect(700, 200), viewport)
    expect(position.placement).toBe('above')
    expect(position.top).toBe(694)
  })

  it('keeps the previous placement while it still fits', () => {
    const position = computeMenuPosition(rect(400, 200), viewport, 'above')
    expect(position.placement).toBe('above')
  })

  it('clamps to the viewport edges and narrow screens', () => {
    const phone = rect(0, 0, 360, 640)
    const position = computeMenuPosition(rect(100, 340), phone)
    expect(position.width).toBe(320)
    expect(position.left).toBe(32)
  })

  it('respects a shrunken visual viewport such as an open keyboard', () => {
    const keyboard = { ...rect(0, 0, 390, 400) }
    const position = computeMenuPosition(rect(300, 20), keyboard)
    expect(position.placement).toBe('above')
    expect(position.maxHeight).toBeLessThanOrEqual(286)
  })
})

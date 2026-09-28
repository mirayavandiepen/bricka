import type { ReactNode } from 'react'
import { SNAP, range, sp, typed } from './anim'
import type { Theme, ToneName } from './theme'
import { Menu, Token, filterRows, type MenuRow } from './ui'

export type Step =
  | { kind: 'type'; text: string; at: number; speed?: number }
  | {
      kind: 'pick'
      trigger: '@' | '/'
      query: string
      at: number
      speed?: number
      /** Frame the Enter key lands and the token is created. */
      enterAt: number
      rows: Array<MenuRow>
      token: { label: string; icon?: ReactNode; tone?: ToneName }
      menuWidth?: number
      menuLeft?: number
    }
  | { kind: 'token'; trigger: '@' | '/'; label: string; icon?: ReactNode; at: number }

/**
 * Plays a scripted message into composer content at `frame`: text typed a
 * key at a time, triggers that open a filtering menu, and tokens that land.
 */
export function play(frame: number, steps: Array<Step>, t: Theme) {
  const nodes: Array<ReactNode> = []
  let lastKey = -Infinity
  let done = true

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]
    if (frame < step.at) {
      done = false
      break
    }
    if (step.kind === 'type') {
      const speed = step.speed ?? 3
      const shown = typed(frame, step.at, step.text, speed)
      nodes.push(<span key={i}>{shown}</span>)
      lastKey = Math.max(lastKey, step.at + (shown.length - 1) * speed)
      if (shown.length < step.text.length) {
        done = false
        break
      }
      continue
    }
    if (step.kind === 'token') {
      nodes.push(
        <Token key={i} t={t} trigger={step.trigger} label={step.label} icon={step.icon} age={frame - step.at} />
      )
      lastKey = Math.max(lastKey, step.at)
      continue
    }

    const speed = step.speed ?? 6
    const typedQuery = frame < step.at + speed ? '' : typed(frame, step.at + speed, step.query, speed)
    const isPending = frame < step.enterAt
    const open = sp(frame, step.at + 1, SNAP)
    const close = range(frame, step.enterAt, step.enterAt + 9)
    const rows = filterRows(step.rows, step.query, frame, step.at, speed)
    const menu =
      close < 1 ? (
        <span style={{ position: 'relative', display: 'inline-block', width: 0 }}>
          <Menu
            t={t}
            rows={rows}
            query={typedQuery}
            open={open * (1 - close)}
            width={step.menuWidth ?? 300}
            style={{
              position: 'absolute',
              top: 26,
              left: step.menuLeft ?? -12,
              zIndex: 10,
              filter: close > 0 ? `blur(${close * 4}px)` : undefined,
            }}
          />
        </span>
      ) : null

    if (isPending) {
      nodes.push(
        <span key={i}>
          {menu}
          <span style={{ color: t.accent }}>{step.trigger}</span>
          {typedQuery}
        </span>
      )
      lastKey = Math.max(lastKey, step.at + typedQuery.length * speed)
      done = false
      break
    }
    nodes.push(
      <span key={i}>
        {menu}
        <Token t={t} trigger={step.trigger} label={step.token.label} icon={step.token.icon} tone={step.token.tone} age={frame - step.enterAt} />
      </span>
    )
    lastKey = Math.max(lastKey, step.enterAt)
  }

  return { nodes, typing: frame - lastKey < 10, done, isEmpty: nodes.length === 0 }
}

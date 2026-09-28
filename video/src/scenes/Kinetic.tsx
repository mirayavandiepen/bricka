import type { ReactNode } from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { POP, range, sp } from '../anim'
import { ArrowUpIcon } from '../icons'
import { opening as t } from '../theme'
import { display } from '../ui'

const GAP = 58

/** Type it. Tag it. Send it. — each phrase rolls in like a picker wheel. */
export function Kinetic() {
  const f = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()
  const starts = [4, 4 + GAP, 4 + GAP * 2]
  const exit = range(f, durationInFrames - 20, durationInFrames)

  const phrase = (i: number, content: ReactNode) => {
    const p = sp(f, starts[i], { damping: 15, stiffness: 150 })
    const q = i < 2 ? sp(f, starts[i + 1], { damping: 22, stiffness: 170 }) : exit
    if (f < starts[i] || q > 0.999) return null
    return (
      <div
        key={i}
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: Math.min(1, p * 1.3) * (1 - q),
          transform: `translateY(${(1 - p) * 180 - q * 160}px) scale(${0.9 + 0.1 * p + (i === 2 ? exit * 0.1 : 0)})`,
          filter: `blur(${(1 - p) * 4 + q * 4}px)`,
        }}
      >
        <div style={{ ...display, fontSize: 250, color: t.pageFg, display: 'flex', alignItems: 'center', gap: 36 }}>
          {content}
        </div>
      </div>
    )
  }

  const tagPop = sp(f, starts[1] + 14, POP)
  const sendPop = sp(f, starts[2] + 12, POP)
  const shoot = range(f, starts[2] + 36, starts[2] + 52)
  const press = f >= starts[2] + 32 && f < starts[2] + 40 ? 1 - Math.abs(f - (starts[2] + 36)) / 4 : 0
  const caretOn = Math.floor(f / 16) % 2 === 0

  return (
    <AbsoluteFill>
      {phrase(
        0,
        <>
          <span>Type it.</span>
          <span
            style={{
              width: 14,
              height: 220,
              borderRadius: 8,
              background: '#2f7df6',
              opacity: caretOn ? 1 : 0.2,
              marginLeft: -20,
            }}
          />
        </>
      )}
      {phrase(
        1,
        <>
          <span>Tag</span>
          <span
            style={{
              display: 'inline-block',
              padding: '4px 56px 24px 50px',
              borderRadius: 999,
              background: `rgb(94 155 255 / ${(t.name === 'light' ? 0.12 : 0.18) * tagPop})`,
              color: tagPop > 0.4 ? t.tokenFg : t.pageFg,
              
              transform: `scale(${0.8 + 0.2 * tagPop})`,
            }}
          >
            <span style={{ opacity: 0.55, fontSize: '0.8em' }}>@</span>it.
          </span>
        </>
      )}
      {phrase(
        2,
        <>
          <span>Send it.</span>
          <span
            style={{
              position: 'relative',
              width: 190,
              height: 190,
              borderRadius: 999,
              background: t.pageFg,
              color: t.page,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              transform: `scale(${sendPop * (1 - press * 0.1)})`,
            }}
          >
            <ArrowUpIcon
              width={110}
              height={110}
              style={{ transform: `translateY(${-shoot * 190 + (shoot > 0.5 ? 380 * (shoot - 0.5) * 0 : 0)}px)` }}
            />
            <ArrowUpIcon
              width={110}
              height={110}
              style={{ position: 'absolute', transform: `translateY(${190 - shoot * 190}px)` }}
            />
          </span>
        </>
      )}
    </AbsoluteFill>
  )
}

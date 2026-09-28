import type { ReactNode } from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { POP, SMOOTH, range, reveal, sp } from '../anim'
import { MONO, SANS } from '../fonts'
import { FileIcon, FolderIcon } from '../icons'
import { opening as t, tone, type ToneName } from '../theme'
import { Token, display } from '../ui'

type Part =
  | { kind: 'text'; text: string }
  | { kind: 'token'; trigger: '@' | '/'; label: string; icon?: ReactNode; type: string; field: string; value: string; tone?: ToneName }

const PARTS: Array<Part> = [
  { kind: 'text', text: 'Fix' },
  { kind: 'token', trigger: '@', label: 'Composer.tsx', icon: <FileIcon />, type: 'file', field: 'id', value: 'src/components/Composer.tsx' },
  { kind: 'text', text: 'using' },
  { kind: 'token', trigger: '@', label: 'design-system', icon: <FolderIcon />, type: 'doc', field: 'id', value: 'docs/design-system', tone: 'green' },
  { kind: 'text', text: 'and check' },
  { kind: 'token', trigger: '/', label: 'accessibility', type: 'command', field: 'id', value: 'accessibility', tone: 'purple' },
]

/** The sent message pulls apart: prose dims, each token drops its payload. */
export function Receives() {
  const f = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()
  const enter = sp(f, 16, { damping: 20, stiffness: 120 })
  const split = sp(f, 44, { damping: 18, stiffness: 90 })
  const exit = range(f, durationInFrames - 22, durationInFrames)
  let tokenIndex = -1

  return (
    <AbsoluteFill style={{ opacity: 1 - exit, filter: `blur(${exit * 3}px)`, transform: `translateY(${-exit * 40}px)` }}>
      <div
        style={{
          position: 'absolute',
          top: 150,
          left: 0,
          right: 0,
          textAlign: 'center',
          ...display,
          fontSize: 124,
          color: t.pageFg,
          ...reveal(sp(f, 8, { damping: 20, stiffness: 120 }), 40, 16),
        }}
      >
        Tokens, <span style={{ color: t.pageDim }}>not text.</span>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 420,
          left: '50%',
          transformOrigin: 'top center',
          transform: `translateX(-50%) translateY(${(1 - enter) * 80}px) scale(2.05)`,
          opacity: enter,
          display: 'flex',
          alignItems: 'center',
          gap: 5 + split * 26,
          fontFamily: SANS,
          fontSize: 15,
          lineHeight: 1.5,
          color: t.fg,
          whiteSpace: 'nowrap',
        }}
      >
        {PARTS.map((part, i) => {
          if (part.kind === 'text') {
            return (
              <span key={i} style={{ opacity: 1 - split * 0.62 }}>
                {part.text}
              </span>
            )
          }
          tokenIndex += 1
          const k = tokenIndex
          const lift = sp(f, 50 + k * 6, POP)
          const line = sp(f, 60 + k * 8, SMOOTH)
          const card = sp(f, 70 + k * 8, POP)
          return (
            <span key={i} style={{ position: 'relative', display: 'inline-block', transform: `translateY(${-lift * 4}px)` }}>
              <Token t={t} trigger={part.trigger} label={part.label} icon={part.icon} tone={part.tone} />
              <span
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: 'calc(100% + 6px)',
                  width: 1,
                  height: 38,
                  background: tone(t, part.tone).solid,
                  transformOrigin: 'top',
                  transform: `scaleY(${line})`,
                }}
              />
              <Card part={part} p={card} />
            </span>
          )
        })}
      </div>

      <div
        style={{
          position: 'absolute',
          top: 900,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: SANS,
          fontSize: 44,
          fontWeight: 600,
          letterSpacing: '-0.02em',
          color: t.pageMuted,
          ...reveal(sp(f, 118, { damping: 20, stiffness: 120 }), 24, 10),
        }}
      >
        Your app receives <span style={{ color: t.pageFg }}>exactly what was referenced.</span>
      </div>
    </AbsoluteFill>
  )
}

function Card({ part, p }: { part: Extract<Part, { kind: 'token' }>; p: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: 'calc(100% + 48px)',
        width: 178,
        padding: '10px 12px 11px',
        borderRadius: 14,
        background: t.bg,
        boxShadow: `0 0 0 1.5px color-mix(in srgb, ${tone(t, part.tone).solid} 45%, transparent)`,
        transformOrigin: 'top center',
        transform: `translateX(-50%) translateY(${(1 - p) * -14}px) scale(${0.7 + 0.3 * p})`,
        opacity: Math.min(1, p * 1.4),
        fontFamily: MONO,
        fontSize: 9.5,
        lineHeight: 1.65,
        color: t.muted,
        textAlign: 'left',
      }}
    >
      <div style={{ color: t.faint }}>{'{'}</div>
      <Line k="type" v="'token'" />
      <Line k="trigger" v={`'${part.trigger}'`} />
      <Line k="item.type" v={`'${part.type}'`} color={tone(t, part.tone).fg} />
      <Line k="item.id" v={`'${part.value.replace(/'/g, '')}'`} />
      <div style={{ color: t.faint }}>{'}'}</div>
    </div>
  )
}

function Line({ k, v, color }: { k: string; v: string; color?: string }) {
  return (
    <div style={{ paddingLeft: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
      <span style={{ color: t.muted }}>{k}</span>
      <span style={{ color: t.faint }}>: </span>
      <span style={{ color: color ?? (t.name === 'light' ? '#b45309' : '#e6c58f') }}>{v}</span>
    </div>
  )
}

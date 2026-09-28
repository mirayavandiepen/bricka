import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { POP, SNAP, range, reveal, sp, typed } from '../anim'
import { MONO, SANS } from '../fonts'
import { CheckIcon, CopyIcon, Logo } from '../icons'
import { display } from '../ui'

const COMMAND = 'npm install @bricka/react'
const TYPE_AT = 64
const COPY_AT = TYPE_AT + COMMAND.length * 2 + 30

/** Name, one line to install it, and the facts that matter. */
export function Outro() {
  const f = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()
  const logo = sp(f, 4, POP)
  const pill = sp(f, 48, { damping: 18, stiffness: 140 })
  const text = typed(f, TYPE_AT, COMMAND, 2)
  const isCopied = f >= COPY_AT + 4
  const press = f >= COPY_AT && f < COPY_AT + 12 ? 1 - Math.abs(f - (COPY_AT + 4)) / 8 : 0
  const check = sp(f, COPY_AT + 4, POP)
  const tip = sp(f, COPY_AT + 6, SNAP) * (1 - range(f, COPY_AT + 60, COPY_AT + 72))
  const isCaretOn = f < COPY_AT && (text.length < COMMAND.length || Math.floor(f / 30) % 2 === 0)
  const fadeOut = range(f, durationInFrames - 24, durationInFrames)

  return (
    <AbsoluteFill style={{ opacity: 1 - fadeOut }}>
      <div
        style={{
          position: 'absolute',
          left: 960 - 700,
          top: 520 - 500,
          width: 1400,
          height: 1000,
          borderRadius: '50%',
          background: 'radial-gradient(closest-side, rgb(47 125 246 / 0.22), transparent)',
          opacity: 0,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 230,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 64,
        }}
      >
        <div style={{ transform: `scale(${logo}) rotate(${(1 - logo) * -40}deg)` }}>
          <Logo size={150} />
        </div>
        <div style={{ ...display, fontSize: 200, color: '#f5f5f7', display: 'flex' }}>
          {[...'Bricka'].map((ch, i) => (
            <span key={i} style={{ display: 'inline-block', ...reveal(sp(f, 10 + i * 3, { damping: 18, stiffness: 140 }), 50, 16) }}>
              {ch}
            </span>
          ))}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 500,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: SANS,
          fontSize: 52,
          fontWeight: 600,
          letterSpacing: '-0.025em',
          color: '#8a8a93',
          ...reveal(sp(f, 30, { damping: 20, stiffness: 120 }), 30, 12),
        }}
      >
        The input for <span style={{ color: '#f5f5f7' }}>AI apps.</span>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 650,
          left: '50%',
          transform: `translateX(-50%) translateY(${(1 - pill) * 60}px) scale(${0.9 + 0.1 * pill})`,
          opacity: Math.min(1, pill * 1.5),
          display: 'flex',
          alignItems: 'center',
          gap: 22,
          height: 112,
          padding: '0 18px 0 44px',
          borderRadius: 999,
          background: '#1c1c1f',
          boxShadow:
            '0 0 0 1px rgb(255 255 255 / 0.1)',
          fontFamily: MONO,
          fontSize: 44,
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ color: '#55555c' }}>$</span>
        <span style={{ color: '#f5f5f7', minWidth: COMMAND.length * 26.4 }}>
          <span style={{ color: '#f5f5f7' }}>{text.slice(0, 11)}</span>
          <span style={{ color: '#a8c8ff' }}>{text.slice(11)}</span>
          <span
            style={{
              display: 'inline-block',
              width: 4,
              height: 48,
              marginLeft: 4,
              verticalAlign: -8,
              borderRadius: 2,
              background: '#5e9bff',
              opacity: isCaretOn ? 1 : 0,
            }}
          />
        </span>
        <div
          style={{
            position: 'relative',
            width: 80,
            height: 80,
            borderRadius: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: isCopied ? 'rgb(63 214 136 / 0.16)' : 'rgb(255 255 255 / 0.07)',
            color: isCopied ? '#3fd688' : '#d4d4d8',
            transform: `scale(${1 - press * 0.12})`,
          }}
        >
          {isCopied ? (
            <CheckIcon width={36} height={36} style={{ transform: `scale(${check})` }} />
          ) : (
            <CopyIcon width={34} height={34} />
          )}
          <div
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 18px)',
              left: '50%',
              padding: '10px 20px',
              borderRadius: 14,
              background: '#f5f5f7',
              color: '#08080a',
              fontFamily: SANS,
              fontSize: 26,
              fontWeight: 700,
              transform: `translateX(-50%) translateY(${(1 - tip) * 10}px) scale(${0.8 + 0.2 * tip})`,
              opacity: tip,
            }}
          >
            Copied
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 860,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 18,
        }}
      >
        {['Open source · MIT', 'React 18+', 'Zero dependencies', 'Light + dark', 'Accessible'].map((label, i) => {
          const p = sp(f, COPY_AT + 20 + i * 5, POP)
          return (
            <span
              key={label}
              style={{
                padding: '14px 26px',
                borderRadius: 999,
                background: 'rgb(255 255 255 / 0.06)',
                boxShadow: 'inset 0 0 0 1px rgb(255 255 255 / 0.09)',
                color: '#d4d4d8',
                fontFamily: SANS,
                fontSize: 28,
                fontWeight: 600,
                transform: `scale(${0.6 + 0.4 * p}) translateY(${(1 - p) * 20}px)`,
                opacity: Math.min(1, p * 1.5),
              }}
            >
              {label}
            </span>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}

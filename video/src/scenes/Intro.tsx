import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { SMOOTH, range, reveal, sp } from '../anim'
import { SANS } from '../fonts'
import { opening as t } from '../theme'
import { LOGO } from '../icons'
import { display } from '../ui'

/**
 * A lone caret blinks; a token springs out beside it to form the mark,
 * which slides aside while the name writes itself in.
 */
export function Intro() {
  const f = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()

  // The caret blinks alone, then the token springs out to its left.
  const pill = sp(f, 36, { damping: 12, stiffness: 150, mass: 0.9 })
  const isBlinkOn = f >= 36 || Math.floor(f / 14) % 2 === 0
  const blink = isBlinkOn ? 1 : 0.1
  const move = sp(f, 96, SMOOTH)
  const exit = range(f, durationInFrames - 22, durationInFrames)

  const size = 300 - 140 * move
  const wordWidth = 560
  const gap = 70
  const shift = ((wordWidth + gap) / 2) * move

  return (
    <AbsoluteFill
      style={{
        opacity: 1 - exit,
        transform: `scale(${1 + exit * 0.08})`,
        filter: `blur(${exit * 3}px)`,
      }}
    >
      {/* halo */}
      <div
        style={{
          position: 'absolute',
          left: 960 - shift - 450,
          top: 470 - 450,
          width: 900,
          height: 900,
          borderRadius: '50%',
          background: `radial-gradient(closest-side, rgb(47 125 246 / ${t.name === 'light' ? 0.24 : 0.35}), transparent)`,
          opacity: 0,
          transform: `scale(${0.4 + 0.6 * pill})`,
        }}
      />
      <svg
        width={size}
        height={size}
        viewBox="0 0 30 32"
        style={{
          position: 'absolute',
          left: 960 - shift - size / 2,
          top: 470 - size / 2,
          overflow: 'visible',
        }}
      >
        <rect
          {...LOGO.token}
          fill="#2f7df6"
          style={{
            transform: `scaleX(${pill}) scaleY(${0.5 + 0.5 * Math.min(1, pill)})`,
            transformOrigin: `${LOGO.token.width}px 16px`,
            opacity: Math.min(1, pill * 3),
          }}
        />
        <rect {...LOGO.caret} fill={t.pageFg} opacity={blink} />
      </svg>

      <div
        style={{
          position: 'absolute',
          left: 960 - shift + size / 2 + gap - 10,
          top: 470 - 96,
          display: 'flex',
          ...display,
          fontSize: 190,
          color: t.pageFg,
        }}
      >
        {[...'Bricka'].map((ch, i) => (
          <span key={i} style={{ display: 'inline-block', ...reveal(sp(f, 104 + i * 4, { damping: 18, stiffness: 140 }), 50, 18) }}>
            {ch}
          </span>
        ))}
      </div>

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 690,
          textAlign: 'center',
          fontFamily: SANS,
          fontSize: 50,
          fontWeight: 500,
          letterSpacing: '-0.02em',
          color: t.pageMuted,
          ...reveal(sp(f, 140, { damping: 20, stiffness: 120 }), 30, 12),
        }}
      >
        The input for <span style={{ color: t.pageFg }}>AI apps.</span>
      </div>
    </AbsoluteFill>
  )
}

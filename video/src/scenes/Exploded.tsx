import type { CSSProperties, ReactNode } from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { POP, SMOOTH, range, reveal, sp } from '../anim'
import { MONO, SANS } from '../fonts'
import { EyeIcon, FileIcon, FlaskIcon, FolderIcon, SparkIcon } from '../icons'
import { opening as t, tone } from '../theme'
import { Caret, Footer, Menu, Token, display } from '../ui'

const W = 460

/** The composer comes apart into its parts, floating in 3D, then snaps back. */
export function Exploded() {
  const f = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()
  const enter = sp(f, 0, { damping: 18, stiffness: 110 })
  const apart = sp(f, 30, { damping: 26, stiffness: 90 })
  const together = sp(f, 172, { damping: 28, stiffness: 120 })
  const e = Math.max(0, Math.min(1, apart * (1 - together)))
  // Once it snaps together it lies flat and glides to the middle of the frame.
  const settle = sp(f, 176, { damping: 26, stiffness: 90 })
  const tilt = sp(f, 30, { damping: 30, stiffness: 60 }) * (1 - settle)
  const exit = range(f, durationInFrames - 20, durationInFrames)
  const camera = `perspective(2600px) translateY(${(1 - enter) * 120}px) scale(${1.7 * (0.9 + 0.1 * enter)}) rotateX(${42 * tilt}deg) rotateZ(${-22 * tilt}deg)`
  /** Each layer carries the whole camera, pivoting on the stack's centre. */
  const place = (x: number, y: number, z: number): CSSProperties => ({
    transform: `${camera} translateZ(${z}px)`,
    transformOrigin: `${W / 2 - x}px ${75 - y}px`,
  })

  const pane = (z: number, y: number, h: number, content: ReactNode, label: string, i: number, style?: CSSProperties) => {
    const labelP = sp(f, 64 + i * 7, POP) * (1 - range(f, 170, 180))
    return (
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: y,
          width: W,
          height: h,
          ...place(0, y, z * 1.5 * e),
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 16,
            background: `color-mix(in srgb, ${t.bg} ${94 * e}%, transparent)`,
            boxShadow: t.name === 'light'
              ? `0 0 0 1px rgb(0 0 0 / ${0.08 * e}), 0 10px 24px -12px rgb(0 0 0 / ${0.14 * e})`
              : `0 0 0 1px rgb(255 255 255 / ${0.14 * e})`,
            ...style,
          }}
        />
        <div style={{ position: 'relative', height: '100%' }}>{content}</div>
        <div
          style={{
            position: 'absolute',
            left: W + 24,
            top: h / 2 - 11,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            opacity: labelP,
            transform: `translateX(${(1 - labelP) * -16}px)`,
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ width: 28 * labelP, height: 1, background: tone(t, 'blue').solid }} />
          <span
            style={{
              fontFamily: MONO,
              fontSize: 15,
              fontWeight: 600,
              color: tone(t, 'blue').fg,
              padding: '3px 9px',
              borderRadius: 8,
              background: tone(t, 'blue').bg,
            }}
          >
            {`<${label} />`}
          </span>
        </div>
      </div>
    )
  }

  return (
    <AbsoluteFill style={{ opacity: 1 - exit, filter: `blur(${exit * 3}px)` }}>
      <div style={{ position: "absolute", top: 80, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ ...display, fontSize: 104, color: t.pageFg, ...reveal(sp(f, 4, { damping: 20, stiffness: 120 }), 40, 14) }}>
          Composable, <span style={{ color: t.pageDim }}>part by part.</span>
        </div>
        <div
          style={{
            marginTop: 24,
            fontFamily: SANS,
            fontSize: 34,
            fontWeight: 500,
            color: t.pageMuted,
            ...reveal(sp(f, 12, { damping: 20, stiffness: 120 }), 24, 10),
          }}
        >
          Use every piece, swap any piece, or go fully headless.
        </div>
      </div>

      <div style={{ position: 'absolute', inset: 0 }}>
        <div
          style={{
            position: 'absolute',
            left: 960 - W / 2 - 90 * tilt,
            top: 790 - 250 * settle,
            width: W,
            height: 150,
            opacity: Math.min(1, enter),
            fontFamily: SANS,
            fontSize: 14,
            WebkitFontSmoothing: "antialiased",
            lineHeight: 1.5,
            color: t.fg,
          }}
        >
          {/* Shell */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              ...place(0, 0, 0),
              borderRadius: 20,
              background: t.bg,
              boxShadow: `${t.shadow}, 0 0 0 1px rgb(94 155 255 / ${0.3 * together})`,
            }}
          />
          {pane(
            60,
            96,
            50,
            <Footer t={t} />,
            'ComposerFooter',
            0,
            { borderRadius: 14 }
          )}
          {pane(
            130,
            50,
            44,
            <div style={{ padding: '10px 18px' }}>
              Fix <Token t={t} label="Composer.tsx" icon={<FileIcon />} /> with <Token t={t} tone="green" label="design-system" icon={<FolderIcon />} />
              <Caret t={t} frame={f} solid={false} />
            </div>,
            'ComposerInput',
            1
          )}
          {pane(
            200,
            0,
            52,
            <div style={{ display: 'flex', gap: 6, padding: '8px 10px 0' }}>
              {['layout.png', 'spec.pdf'].map((name, i) => (
                <div
                  key={name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    height: 38,
                    padding: '4px 12px 4px 4px',
                    borderRadius: 10,
                    background: t.hover,
                    fontSize: 12.5,
                    fontWeight: 600,
                  }}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 6,
                      background: i === 0 ? '#007aff' : t.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: t.muted,
                    }}
                  >
                    {i === 1 && <FileIcon />}
                  </div>
                  {name}
                </div>
              ))}
            </div>,
            'ComposerAttachments',
            2
          )}
          <div
            style={{
              position: 'absolute',
              left: 36,
              top: 150 - 40 * e,
              ...place(36, 150 - 40 * e, 400 * e),
              opacity: range(e, 0.25, 0.6, [0, 1], (x) => x),
            }}
          >
            <Menu
              t={t}
              width={250}
              rows={[
                { id: 'a', label: 'accessibility', description: 'Audit', icon: <EyeIcon />, tone: 'purple' as const },
                { id: 't', label: 'test', description: 'Run tests', icon: <FlaskIcon />, tone: 'teal' as const },
                { id: 'r', label: 'review', description: 'Diff', icon: <SparkIcon />, tone: 'orange' as const },
              ]}
              active={sp(f, 110, { damping: 26, stiffness: 120 })}
            />
            <div
              style={{
                position: 'absolute',
                left: 250 + 24,
                top: 64,
                fontFamily: MONO,
                fontSize: 15,
                fontWeight: 600,
                color: tone(t, 'purple').fg,
                padding: '3px 9px',
                borderRadius: 8,
                background: tone(t, 'purple').bg,
                whiteSpace: 'nowrap',
                opacity: sp(f, 91, POP) * (1 - range(f, 170, 180)),
              }}
            >
              {'useComposerMenu()'}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}

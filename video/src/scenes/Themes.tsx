import { AbsoluteFill, interpolateColors, useCurrentFrame, useVideoConfig } from 'remotion'
import { SNAP, range, sp } from '../anim'
import { MONO, SANS } from '../fonts'
import { EyeIcon, FileIcon, FlaskIcon, FolderIcon, MoonIcon, SparkIcon, SunIcon } from '../icons'
import { dark, light, opening, withAccent, type Theme } from '../theme'
import { Background, Captions, Composer, Input, Menu, Token } from '../ui'

// The opening appearance first while the brand colour cycles, then the
// switch wipes to the other one, the frame splits to show both, and dark
// takes over for the outro.
const FIRST = opening
const SECOND = opening === light ? dark : light
const CYCLE = 50
const STEP = 26
const TOGGLE_IN = 158
const REVEAL = 196
const SPLIT = 262
const TAKEOVER = 322

const ACCENTS = [
  { name: '#2f7df6', light: ['#2f7df6', '#1b63d8'], dark: ['#5e9bff', '#a8c8ff'] },
  { name: '#7c5cff', light: ['#7c5cff', '#5b3fd9'], dark: ['#9d85ff', '#cbbcff'] },
  { name: '#f0468b', light: ['#e8397f', '#c02466'], dark: ['#ff6fa8', '#ffb3d0'] },
  { name: '#17a55f', light: ['#17a55f', '#0f7a45'], dark: ['#3fd688', '#a2efc5'] },
  { name: '#2f7df6', light: ['#2f7df6', '#1b63d8'], dark: ['#5e9bff', '#a8c8ff'] },
]

function accentAt(frame: number, base: Theme): Theme {
  const inputs = ACCENTS.map((_, i) => CYCLE + i * STEP)
  const key = base.name
  const accent = interpolateColors(frame, inputs, ACCENTS.map((a) => a[key][0]))
  const fg = interpolateColors(frame, inputs, ACCENTS.map((a) => a[key][1]))
  return withAccent(base, accent, fg)
}

const cap = (t: Theme, a: string, b: string) => (
  <div style={{ fontFamily: SANS, fontSize: 84, fontWeight: 800, letterSpacing: '-0.045em', color: t.pageFg }}>
    {a} <span style={{ color: t.pageMuted }}>{b}</span>
  </div>
)

function Stage({ base, f }: { base: Theme; f: number }) {
  const t = accentAt(f, base)
  const { durationInFrames } = useVideoConfig()
  const enter = sp(f, 0, { damping: 18, stiffness: 120 })
  const exit = range(f, durationInFrames - 20, durationInFrames)
  return (
    <AbsoluteFill>
      <Background t={base} frame={f + 900} />
      <Captions
        frame={f}
        style={{ top: 130 }}
        cues={[
          { from: 4, content: cap(t, 'Made for', `the ${FIRST.name}.`) },
          { from: CYCLE - 4, content: cap(t, 'Your brand.', 'One variable.') },
          { from: REVEAL + 10, content: cap(t, 'And', `the ${SECOND.name}.`) },
          { from: SPLIT + 4, content: cap(t, 'Both.', 'Out of the box.') },
        ]}
      />
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 340,
          transformOrigin: 'top center',
          transform: `translateX(-50%) translateY(${(1 - enter) * 100}px) scale(${2.05 * (0.92 + 0.08 * enter)})`,
          opacity: Math.min(1, enter * 1.5) * (1 - exit),
          filter: `blur(${exit * 3}px)`,
        }}
      >
        <Composer t={t} width={560}>
          <Input t={t}>
            Fix <Token t={t} label="Composer.tsx" icon={<FileIcon />} /> using{' '}
            <Token t={t} tone="green" label="design-system" icon={<FolderIcon />} /> and{' '}
            <span style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: -12, top: 26, zIndex: 5 }}>
                <Menu
                  t={t}
                  width={270}
                  query="a"
                  active={1}
                  rows={[
                    { id: 'a', label: 'accessibility', description: 'Audit for a11y', icon: <EyeIcon />, tone: 'purple' as const },
                    { id: 'r', label: 'review', description: 'Review the diff', icon: <SparkIcon />, tone: 'orange' as const },
                    { id: 't', label: 'test', description: 'Run the tests', icon: <FlaskIcon />, tone: 'teal' as const },
                  ]}
                />
              </span>
              <span style={{ color: t.accent }}>/</span>
            </span>
            <span
              style={{
                display: 'inline-block',
                width: 2,
                height: '1.2em',
                verticalAlign: '-0.22em',
                marginLeft: 1,
                borderRadius: 2,
                background: t.accent,
              }}
            />
          </Input>
        </Composer>
      </div>
      <AccentChip t={t} f={f} />
    </AbsoluteFill>
  )
}

function AccentChip({ t, f }: { t: Theme; f: number }) {
  const p = sp(f, CYCLE, SNAP)
  const out = range(f, TOGGLE_IN - 12, TOGGLE_IN + 4)
  if (f < CYCLE || out >= 1) return null
  const index = Math.min(ACCENTS.length - 1, Math.max(0, Math.round((f - CYCLE) / STEP)))
  const hex = ACCENTS[index][t.name === 'dark' ? 'dark' : 'light'][0]
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: 900,
        transform: `translateX(-50%) translateY(${(1 - p) * 30}px) scale(${0.9 + 0.1 * p})`,
        opacity: p * (1 - out),
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '16px 28px 16px 18px',
        borderRadius: 999,
        background: t.bg,
        boxShadow: t.shadow,
        fontFamily: MONO,
        fontSize: 32,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: 34, height: 34, borderRadius: 999, background: t.accent, }} />
      <span style={{ color: t.muted }}>--bricka-accent:</span>
      <span style={{ color: t.fg, fontWeight: 600 }}>{hex}</span>
    </div>
  )
}

/** Dark, a circular wipe to light, then a split with the accent cycling. */
export function Themes() {
  const f = useCurrentFrame()
  const reveal = sp(f, REVEAL, { damping: 200, stiffness: 40 })
  const split = sp(f, SPLIT, { damping: 20, stiffness: 90 })
  const takeover = sp(f, TAKEOVER, { damping: 24, stiffness: 90 })
  const flip = sp(f, REVEAL - 6, SNAP)
  const knob = FIRST === light ? 1 - flip : flip
  const toggleOut = range(f, SPLIT - 10, SPLIT + 4)
  const toggleIn = sp(f, TOGGLE_IN, SNAP)
  const cx = SECOND === dark ? 923 : 997
  const cy = 948
  const inset = SECOND === dark ? 50 * split * (1 - takeover) : 50 * split + 50 * takeover
  const clip = f < SPLIT ? `circle(${reveal * 2300}px at ${cx}px ${cy}px)` : `inset(0 0 0 ${inset}%)`
  const dividerX = (inset / 100) * 1920
  const { durationInFrames } = useVideoConfig()
  const fade = range(f, 0, 12) * (1 - range(f, durationInFrames - 18, durationInFrames))

  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <Stage base={FIRST} f={f} />
      {f >= REVEAL && (
        <AbsoluteFill style={{ clipPath: clip }}>
          <Stage base={SECOND} f={f} />
        </AbsoluteFill>
      )}

      {f >= SPLIT && (
        <div style={{ position: 'absolute', left: dividerX - 1, top: 0, bottom: 0, width: 2, background: 'rgb(255 255 255 / 0.85)',  opacity: split * (1 - takeover) }}>
          <div
            style={{
              position: 'absolute',
              left: -30,
              top: 540 - 30,
              width: 60,
              height: 60,
              borderRadius: 999,
              background: '#fff',
              boxShadow: '0 0 0 1px rgb(0 0 0 / 0.08), 0 4px 12px rgb(0 0 0 / 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              color: '#171717',
              transform: `scale(${split})`,
            }}
          >
            {FIRST === light ? <SunIcon width={20} height={20} /> : <MoonIcon width={20} height={20} />}
            {FIRST === light ? <MoonIcon width={20} height={20} /> : <SunIcon width={20} height={20} />}
          </div>
        </div>
      )}

      {/* iOS-style segmented toggle that triggers the wipe */}
      {f >= TOGGLE_IN && toggleOut < 1 && (
        <div
          style={{
            position: 'absolute',
            left: 960 - 80,
            top: cy - 38,
            width: 160,
            height: 76,
            borderRadius: 999,
            padding: 6,
            background: knob > 0.5 ? 'rgb(0 0 0 / 0.08)' : 'rgb(255 255 255 / 0.1)',
            boxShadow: knob > 0.5 ? 'inset 0 0 0 1px rgb(0 0 0 / 0.08)' : 'inset 0 0 0 1px rgb(255 255 255 / 0.12)',
            opacity: toggleIn * (1 - toggleOut),
            transform: `scale(${(0.8 + 0.2 * toggleIn) * (1 - toggleOut * 0.2)})`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 6,
              left: 6 + knob * 74,
              width: 74,
              height: 64,
              borderRadius: 999,
              background: knob > 0.5 ? '#ffffff' : '#2c2c31',
              boxShadow: '0 1px 4px rgb(0 0 0 / 0.2)',
              transform: `scaleX(${1 + Math.sin(knob * Math.PI) * 0.25})`,
            }}
          />
          <div style={{ position: 'absolute', inset: 6, display: 'flex' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: knob > 0.5 ? '#8a8a93' : '#f5f5f7' }}>
              <MoonIcon width={28} height={28} />
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: knob > 0.5 ? '#171717' : '#8a8a93' }}>
              <SunIcon width={28} height={28} />
            </div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  )
}

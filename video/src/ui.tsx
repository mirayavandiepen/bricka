import type { CSSProperties, ReactNode } from 'react'
import { AbsoluteFill, interpolate } from 'remotion'
import { POP, SNAP, range, sp } from './anim'
import { MONO, SANS } from './fonts'
import {
  ArrowUpIcon,
  ChevronIcon,
  GlobeIcon,
  PaperclipIcon,
} from './icons'
import { alpha, tone as toneOf, type Theme, type ToneName } from './theme'

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function Background({ t }: { t: Theme; frame?: number; glow?: number }) {
  return <AbsoluteFill style={{ background: t.page }} />
}

/** Big display type. */
export const display: CSSProperties = {
  fontFamily: SANS,
  fontWeight: 800,
  letterSpacing: '-0.045em',
  lineHeight: 0.98,
}

export function Eyebrow({ children, color }: { children: ReactNode; color: string }) {
  return (
    <div
      style={{
        fontFamily: SANS,
        fontSize: 22,
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color,
      }}
    >
      {children}
    </div>
  )
}

/** An inline key hint inside a caption, like the docs hero. */
export function Kbd({
  children,
  tone = 'blue',
  t,
}: {
  children: ReactNode
  tone?: 'blue' | 'neutral' | 'violet'
  t?: Theme
}) {
  const isLight = t?.name === 'light'
  const tones = (
    isLight
      ? {
          blue: ['rgb(47 125 246 / 0.12)', '#1b63d8'],
          neutral: ['rgb(0 0 0 / 0.06)', '#1d1d1f'],
          violet: ['rgb(124 92 255 / 0.12)', '#5b3fd9'],
        }
      : {
          blue: ['rgb(94 155 255 / 0.18)', '#a8c8ff'],
          neutral: ['rgb(255 255 255 / 0.1)', '#ededef'],
          violet: ['rgb(160 130 255 / 0.2)', '#cbbcff'],
        }
  )[tone]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '1.25em',
        height: '1.25em',
        padding: '0 0.3em',
        margin: '0 0.12em',
        borderRadius: '0.32em',
        background: tones[0],
        color: tones[1],
        fontFamily: MONO,
        fontWeight: 600,
        fontSize: '0.86em',
        verticalAlign: '0.06em',
        boxShadow: `inset 0 0 0 1px ${alpha(tones[1], 18)}`,
      }}
    >
      {children}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Composer                                                            */
/* ------------------------------------------------------------------ */

export function Composer({
  t,
  width = 620,
  focus = 1,
  drag = 0,
  attachments,
  children,
  footer,
  style,
}: {
  t: Theme
  width?: number
  focus?: number
  drag?: number
  attachments?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  style?: CSSProperties
}) {
  let ring = ''
  if (drag > 0) {
    ring = `0 0 0 ${2 * drag}px ${t.accent}, 0 0 0 ${6 * drag}px ${t.focus}, `
  } else if (focus > 0) {
    ring = `0 0 0 1px ${alpha(t.accent, 50 * focus)}, 0 0 0 ${4 * focus}px ${alpha(t.focus, 100 * focus)}, `
  }
  return (
    <div
      style={{
        position: 'relative',
        width,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: SANS,
        fontSize: 14,
        lineHeight: 1.5,
        color: t.fg,
        background: t.bg,
        borderRadius: 20,
        boxShadow: ring + t.shadow,
        ...style,
      }}
    >
      {attachments}
      {children}
      {footer ?? <Footer t={t} />}
    </div>
  )
}

export function Input({
  children,
  placeholder,
  t,
}: {
  children?: ReactNode
  placeholder?: string
  t: Theme
}) {
  return (
    <div
      style={{
        position: 'relative',
        zIndex: 2,
        minHeight: 21,
        padding: '16px 18px 6px',
        whiteSpace: 'pre-wrap',
      }}
    >
      {placeholder && (
        <span style={{ position: 'absolute', color: t.faint }}>{placeholder}</span>
      )}
      {children}
    </div>
  )
}

export function ActionButton({
  t,
  children,
  active = 0,
  press = 0,
  label,
}: {
  t: Theme
  children: ReactNode
  active?: number
  press?: number
  label?: string
}) {
  const pressedBg = press > 0 ? t.hover : 'transparent'
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        minWidth: 32,
        height: 32,
        padding: '0 8px',
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 500,
        color: active > 0.5 ? t.tokenFg : t.muted,
        background: active > 0 ? alpha(t.tokenBg, 100 * active) : pressedBg,
        scale: String(1 - press * 0.08),
      }}
    >
      {children}
      {label}
    </div>
  )
}

export function Submit({
  t,
  enabled = 1,
  press = 0,
}: {
  t: Theme
  enabled?: number
  press?: number
}) {
  return (
    <div
      style={{
        position: 'relative',
        width: 32,
        height: 32,
        borderRadius: 999,
        marginInlineStart: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: enabled > 0.5 ? t.fg : t.selected,
        color: enabled > 0.5 ? t.bg : t.faint,
        scale: String(1 - press * 0.12),
        
      }}
    >
      <ArrowUpIcon />
    </div>
  )
}

export function Footer({
  t,
  enabled = 1,
  press = 0,
  web = 0,
  attachPress = 0,
}: {
  t: Theme
  enabled?: number
  press?: number
  web?: number
  attachPress?: number
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        padding: '4px 10px 10px',
      }}
    >
      <ActionButton t={t} press={attachPress}>
        <PaperclipIcon width={15} height={15} />
      </ActionButton>
      <ActionButton t={t} active={web} label="Search">
        <GlobeIcon width={15} height={15} />
      </ActionButton>
      <div style={{ flex: 1 }} />
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          height: 32,
          padding: '0 10px',
          marginRight: 6,
          borderRadius: 999,
          fontSize: 13,
          fontWeight: 500,
          color: t.muted,
        }}
      >
        Agent
        <ChevronIcon width={13} height={13} />
      </div>
      <Submit t={t} enabled={enabled} press={press} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Tokens and caret                                                    */
/* ------------------------------------------------------------------ */

export function Token({
  t,
  trigger = '@',
  label,
  icon,
  age = 999,
  selected = 0,
  remove = 0,
  tone,
  style,
}: {
  t: Theme
  trigger?: '@' | '/'
  /** Colour by kind of context; the accent when omitted. */
  tone?: ToneName
  label: string
  icon?: ReactNode
  /** Frames since the token was created, for the landing pop. */
  age?: number
  selected?: number
  remove?: number
  style?: CSSProperties
}) {
  const p = sp(age, 0, POP)
  const glow = range(age, 0, 26)
  const isCommand = trigger === '/'
  const c = toneOf(t, tone)
  // Untinted commands keep the library's neutral chip.
  const isNeutral = isCommand && !tone
  const bg = isNeutral ? t.selected : c.bg
  const selectedRing = isNeutral ? t.borderStrong : alpha(c.solid, 55)
  const selectedBg = isNeutral ? t.borderStrong : c.selected
  const shadows = [
    selected > 0 ? `0 0 0 ${selected}px ${selectedRing}` : null,
    age < 30 ? `0 0 0 ${2 + 4 * glow}px ${alpha(c.solid, 30 * (1 - glow))}` : null,
  ].filter(Boolean)
  return (
    <span
      style={{
        display: 'inline-block',
        maxWidth: remove > 0 ? `${(1 - remove) * 14}em` : undefined,
        overflow: remove > 0 ? 'hidden' : undefined,
        verticalAlign: 'bottom',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          display: 'inline-block',
          padding: '0 8px 0 7px',
          margin: '0 1px',
          borderRadius: 999,
          background: selected > 0 ? selectedBg : bg,
          color: isNeutral ? t.fg : c.fg,
          fontWeight: isNeutral ? 500 : 600,
          fontFamily: isCommand ? MONO : undefined,
          fontSize: isCommand ? '0.9em' : undefined,
          lineHeight: isCommand ? '1.6' : '1.45',
          scale: String((0.55 + 0.45 * p) * (1 - remove * 0.4)),
          opacity: Math.min(1, p * 1.5) * (1 - remove),
          boxShadow: shadows.join(', ') || undefined,
          whiteSpace: 'nowrap',
          ...style,
        }}
      >
        {icon && (
          <span
            style={{
              display: 'inline-flex',
              width: 14,
              height: 14,
              marginRight: 4,
              verticalAlign: -2,
              opacity: 0.85,
            }}
          >
            {icon}
          </span>
        )}
        {isCommand && <span style={{ opacity: 0.55 }}>/</span>}
        {label}
      </span>
    </span>
  )
}

export function Caret({
  t,
  frame,
  solid,
  hidden,
}: {
  t: Theme
  frame: number
  solid: boolean
  hidden?: boolean
}) {
  // iOS-style fade blink, held solid while keys are landing.
  const phase = (frame % 64) / 64
  const blink = interpolate(phase, [0, 0.5, 0.62, 0.88, 1], [1, 1, 0, 0, 1])
  let opacity = blink
  if (hidden) opacity = 0
  else if (solid) opacity = 1
  return (
    <span
      style={{
        display: 'inline-block',
        width: 2,
        height: '1.2em',
        marginLeft: 1,
        marginRight: -3,
        verticalAlign: '-0.22em',
        borderRadius: 2,
        background: t.accent,
        opacity,
      }}
    />
  )
}

/* ------------------------------------------------------------------ */
/* Menu                                                                */
/* ------------------------------------------------------------------ */

export type MenuRow = {
  id: string
  label: string
  description?: string
  icon?: ReactNode
  group?: string
  tone?: ToneName
  /** 0..1 — rows collapse as the query filters them away. */
  v?: number
}

/** Fuzzy subsequence match; returns matched indices or null. */
export function match(label: string, query: string): Array<number> | null {
  if (!query) return []
  const lower = label.toLowerCase()
  const q = query.toLowerCase()
  // Prefer a contiguous run, like the library's scorer would.
  const at = lower.indexOf(q)
  if (at >= 0) return Array.from({ length: q.length }, (_, i) => at + i)
  const out: Array<number> = []
  let from = 0
  for (const ch of q) {
    const i = lower.indexOf(ch, from)
    if (i < 0) return null
    out.push(i)
    from = i + 1
  }
  return out
}

function Highlighted({ text, query, t }: { text: string; query: string; t: Theme }) {
  const hits = new Set(match(text, query) ?? [])
  return (
    <>
      {[...text].map((ch, i) => (
        <span key={i} style={hits.has(i) ? { color: t.accent } : undefined}>
          {ch}
        </span>
      ))}
    </>
  )
}

const ROW = 36
const LABEL = 30
const GAP = 6

export function Menu({
  t,
  rows,
  query = '',
  active = 0,
  open = 1,
  width = 300,
  loading,
  enterFrom = 'top',
  style,
}: {
  t: Theme
  rows: Array<MenuRow>
  query?: string
  /** Fractional index into visible rows, so the highlight can glide. */
  active?: number
  open?: number
  width?: number
  /** Frame count for the indeterminate progress bar, or undefined. */
  loading?: number
  enterFrom?: 'top' | 'bottom'
  style?: CSSProperties
}) {
  // Lay rows out by hand so heights, labels and the highlight can animate.
  type Placed = { kind: 'label' | 'row'; y: number; h: number; row?: MenuRow; text?: string; v: number }
  const placed: Array<Placed> = []
  let y = 0
  let lastGroup: string | undefined
  const groups = new Map<string, number>()
  for (const row of rows) {
    if (row.group) groups.set(row.group, Math.max(groups.get(row.group) ?? 0, row.v ?? 1))
  }
  const rowTops: Array<number> = []
  for (const row of rows) {
    const v = row.v ?? 1
    if (row.group && row.group !== lastGroup) {
      const gv = groups.get(row.group) ?? 1
      if (lastGroup) y += GAP * gv
      placed.push({ kind: 'label', y, h: LABEL * gv, text: row.group, v: gv })
      y += LABEL * gv
      lastGroup = row.group
    }
    if (v > 0.001) rowTops.push(y)
    placed.push({ kind: 'row', y, h: ROW * v, row, v })
    y += ROW * v
  }
  const total = y
  const lo = Math.floor(active)
  const hi = Math.min(rowTops.length - 1, lo + 1)
  const highlightY =
    rowTops.length === 0
      ? 0
      : interpolate(active - lo, [0, 1], [rowTops[Math.min(lo, rowTops.length - 1)], rowTops[hi]])
  const activeIndex = Math.round(active)
  let visibleIndex = -1

  return (
    <div
      style={{
        position: 'relative',
        width,
        height: total + 12,
        overflow: 'hidden',
        borderRadius: 16,
        background: t.popoverBg,
        boxShadow: t.popoverShadow,
        color: t.fg,
        fontFamily: SANS,
        fontSize: 13.5,
        lineHeight: 1.4,
        transformOrigin: enterFrom === 'top' ? 'top left' : 'bottom left',
        opacity: Math.min(1, open * 1.4),
        transform: `translateY(${(1 - open) * (enterFrom === 'top' ? -8 : 8)}px) scale(${0.94 + 0.06 * open})`,
        ...style,
      }}
    >
      {loading !== undefined && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '30%',
            height: 2,
            borderRadius: 999,
            background: t.accent,
            transform: `translateX(${interpolate(loading % 54, [0, 54], [-100, 340])}%)`,
          }}
        />
      )}
      <div style={{ position: 'absolute', inset: 6 }}>
        {rowTops.length > 0 && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: highlightY,
              height: ROW,
              borderRadius: 10,
              background: t.selected,
            }}
          />
        )}
        {placed.map((item, i) => {
          if (item.kind === 'label') {
            return (
              <div
                key={`l${i}`}
                style={{
                  position: 'absolute',
                  top: item.y,
                  left: 0,
                  right: 0,
                  height: item.h,
                  overflow: 'hidden',
                  padding: '10px 10px 5px',
                  color: t.faint,
                  fontSize: 11.5,
                  fontWeight: 500,
                  opacity: item.v,
                }}
              >
                {item.text}
              </div>
            )
          }
          const row = item.row!
          if (item.v > 0.001) visibleIndex += 1
          const isActive = item.v > 0.5 && visibleIndex === activeIndex
          const tileBg = isActive ? t.popoverBg : t.hover
          const tileFg = isActive ? t.fg : t.muted
          return (
            <div
              key={row.id}
              style={{
                position: 'absolute',
                top: item.y,
                left: 0,
                right: 0,
                height: item.h,
                overflow: 'hidden',
                opacity: item.v,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  height: ROW,
                  padding: '0 10px 0 6px',
                  transform: `scale(${0.96 + 0.04 * item.v})`,
                  transformOrigin: 'left center',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    flex: 'none',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: row.tone ? toneOf(t, row.tone).bg : tileBg,
                    boxShadow: isActive ? `0 0 0 1px ${t.border}, 0 1px 2px rgb(0 0 0 / 0.06)` : 'none',
                    color: row.tone ? toneOf(t, row.tone).fg : tileFg,
                  }}
                >
                  {row.icon}
                </span>
                <span style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
                  <Highlighted text={row.label} query={query} t={t} />
                </span>
                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    overflow: 'hidden',
                    color: t.faint,
                    fontSize: 12.5,
                    textAlign: 'right',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {row.description}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Visibility of each row while a query is typed a character every `speed`
 * frames from `start` (the trigger char lands at `start`).
 */
export function filterRows(
  rows: Array<MenuRow>,
  query: string,
  frame: number,
  start: number,
  speed: number
): Array<MenuRow> {
  return rows.map((row) => {
    let hideAt = Infinity
    for (let k = 1; k <= query.length; k++) {
      if (!match(row.label, query.slice(0, k))) {
        hideAt = start + k * speed
        break
      }
    }
    return { ...row, v: hideAt === Infinity ? 1 : 1 - range(frame, hideAt, hideAt + 9) }
  })
}

/* ------------------------------------------------------------------ */
/* Keys                                                                */
/* ------------------------------------------------------------------ */

export function Keycap({
  label,
  press = 0,
  lit = 0,
  size = 56,
  wide,
  light,
}: {
  label: ReactNode
  press?: number
  lit?: number
  size?: number
  wide?: boolean
  light?: boolean
}) {
  const face = light ? ['#ffffff', '#f1f1f4'] : ['#2c2c31', '#1e1e22']
  const ink = light ? '#1d1d1f' : '#ededef'
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: wide ? size * 1.7 : size,
        height: size,
        padding: `0 ${size * 0.26}px`,
        borderRadius: size * 0.24,
        fontFamily: SANS,
        fontSize: size * 0.4,
        fontWeight: 600,
        color: lit > 0.5 ? '#ffffff' : ink,
        background: lit > 0 ? `color-mix(in srgb, #007aff ${100 * lit}%, ${face[0]})` : face[0],
        boxShadow: [
          `inset 0 1px 0 rgb(255 255 255 / ${0.12 + 0.1 * lit})`,
          light ? `0 0 0 1px rgb(0 0 0 / ${0.1 - 0.05 * lit})` : `0 0 0 1px rgb(255 255 255 / ${0.08 + 0.1 * lit})`,
          `0 ${4 * (1 - press)}px 0 ${light ? 'rgb(0 0 0 / 0.14)' : 'rgb(0 0 0 / 0.55)'}`,

        ].join(', '),
        transform: `translateY(${press * 4}px)`,
      }}
    >
      {label}
    </div>
  )
}

export type KeyEvent = { at: number; keys: Array<ReactNode>; label?: string }

/** Screencast-style key readout that pops in with each keystroke. */
export function KeyHud({
  frame,
  events,
  style,
  light,
}: {
  frame: number
  events: Array<KeyEvent>
  style?: CSSProperties
  light?: boolean
}) {
  const current = [...events].reverse().find((e) => frame >= e.at)
  if (!current) return null
  const age = frame - current.at
  const inP = sp(age, 0, SNAP)
  const out = range(age, 34, 46)
  if (out >= 1) return null
  const press = age < 3 ? age / 3 : 1 - range(age, 3, 12)
  const keySize = 44
  const inset = 12
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: `${inset}px 22px ${inset}px ${inset}px`,
        // Concentric with the keycaps: outer radius = keycap radius + inset.
        borderRadius: keySize * 0.24 + inset,
        background: light ? '#ffffff' : '#1c1c1f',
        boxShadow: light
          ? '0 0 0 1px rgb(0 0 0 / 0.06), 0 4px 12px rgb(0 0 0 / 0.06)'
          : '0 0 0 1px rgb(255 255 255 / 0.09)',
        transform: `translateX(-50%) translateY(${(1 - inP) * 24 + out * 10}px) scale(${0.85 + 0.15 * inP})`,
        opacity: inP * (1 - out),
        fontFamily: SANS,
        ...style,
      }}
    >
      {current.keys.map((k, i) => (
        <Keycap key={i} label={k} size={keySize} press={press} lit={1 - range(age, 6, 30)} light={light} />
      ))}
      {current.label && (
        <span style={{ color: light ? '#3a3a40' : '#d4d4d8', fontSize: 22, fontWeight: 600, paddingLeft: 4 }}>
          {current.label}
        </span>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Captions                                                            */
/* ------------------------------------------------------------------ */

export type Cue = { from: number; content: ReactNode }

/** Captions that hand off: the old line lifts and blurs, the new one rises. */
export function Captions({
  frame,
  cues,
  style,
}: {
  frame: number
  cues: Array<Cue>
  style?: CSSProperties
}) {
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, ...style }}>
      {cues.map((cue, i) => {
        const next = cues[i + 1]
        const inP = sp(frame, cue.from, { damping: 20, stiffness: 150 })
        const outP = next ? range(frame, next.from - 4, next.from + 10) : 0
        if (frame < cue.from || outP >= 1) return null
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              textAlign: 'center',
              opacity: inP * (1 - outP),
              transform: `translateY(${(1 - inP) * 36 - outP * 30}px)`,
              filter: `blur(${(1 - inP) * 3 + outP * 3}px)`,
            }}
          >
            {cue.content}
          </div>
        )
      })}
    </div>
  )
}

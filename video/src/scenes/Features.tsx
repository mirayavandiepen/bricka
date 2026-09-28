import type { ReactNode } from 'react'
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import { POP, SMOOTH, SNAP, range, reveal, sp, typed } from '../anim'
import { MONO, SANS } from '../fonts'
import { BranchIcon, FileIcon, FolderIcon, IssueIcon, PersonIcon } from '../icons'
import { opening as t } from '../theme'
import {
  Caret,
  Composer,
  Eyebrow,
  Footer,
  Input,
  KeyHud,
  Keycap,
  Menu,
  Token,
  display,
  type KeyEvent,
} from '../ui'

/* ------------------------------------------------------------------ */

function Feature({
  eyebrow,
  color = t.name === 'light' ? '#007aff' : '#5e9bff',
  title,
  body,
  children,
  demoTop = 400,
  scale = 1.75,
}: {
  eyebrow: string
  color?: string
  title: ReactNode
  body: ReactNode
  children: (f: number) => ReactNode
  demoTop?: number
  scale?: number
}) {
  const f = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()
  const exit = range(f, durationInFrames - 18, durationInFrames)
  const demo = sp(f, 4, { damping: 18, stiffness: 120 })
  const out = {
    opacity: 1 - exit,
    filter: `blur(${exit * 3}px)`,
  }
  return (
    <AbsoluteFill style={out}>
      <div
        style={{
          position: 'absolute',
          left: 150,
          top: 0,
          bottom: 0,
          width: 640,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 26,
          transform: `translateY(${-exit * 30}px)`,
        }}
      >
        <div style={reveal(sp(f, 2, SMOOTH), 20, 8)}>
          <Eyebrow color={color}>{eyebrow}</Eyebrow>
        </div>
        <div style={{ ...display, fontSize: 92, color: t.pageFg, ...reveal(sp(f, 6, { damping: 20, stiffness: 120 }), 40, 14) }}>
          {title}
        </div>
        <div
          style={{
            fontFamily: SANS,
            fontSize: 30,
            fontWeight: 500,
            lineHeight: 1.4,
            letterSpacing: '-0.01em',
            color: t.pageMuted,
            ...reveal(sp(f, 12, { damping: 20, stiffness: 120 }), 30, 10),
          }}
        >
          {body}
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 1350,
          top: demoTop,
          transformOrigin: 'top center',
          transform: `translateX(-50%) translateY(${(1 - demo) * 80 + exit * -30}px) scale(${scale * (0.9 + 0.1 * demo)})`,
          opacity: Math.min(1, demo * 1.5),
        }}
      >
        {children(f)}
      </div>
    </AbsoluteFill>
  )
}

const hud = (f: number, events: Array<KeyEvent>) => (
  <div style={{ position: 'absolute', left: '50%', top: 0, width: 0, height: 0, scale: String(1 / 1.75) }}>
    <KeyHud frame={f} events={events} light={t.name === 'light'} style={{ top: 0 }} />
  </div>
)

/* ------------------------------------------------------------------ */

const ASK = 'why does the menu '
const GHOSTS = ['flicker when it opens in Safari?', 'close when I scroll the page?', 'lose focus after picking an item?']

export function Autocomplete() {
  return (
    <Feature
      eyebrow="Autocomplete"
      color={t.name === 'light' ? '#af52de' : '#bf5af2'}
      title={<>Ghost text that writes ahead.</>}
      body={<>Stream suggestions from any model. <b style={{ color: t.pageFg }}>Tab</b> to accept, <b style={{ color: t.pageFg }}>⇧ Tab</b> to cycle.</>}
    >
      {(f) => {
        const text = typed(f, 20, ASK, 2.5)
        const loading = f >= 68 && f < 84
        const cycle = f >= 132 ? 1 : 0
        const accept = range(f, 160, 170)
        const words = GHOSTS[cycle].match(/\s*\S+/g) ?? []
        const streamStart = cycle === 0 ? 84 : 132
        const shownWords = Math.max(0, Math.min(words.length, Math.floor((f - streamStart) / 4) + 1))
        const ghost = f >= 84 ? words.slice(0, cycle === 0 ? shownWords : words.length).join('') : ''
        const swap = cycle === 1 ? sp(f, 132, SNAP) : 1
        const counter = f >= 112 && accept < 1
        return (
          <div style={{ position: 'relative' }}>
            <Composer t={t} width={430}>
              <Input t={t}>
                <span>{text}</span>
                {accept > 0 ? (
                  <>
                    <span style={{ color: interpolate(accept, [0, 1], [0, 1]) > 0.5 ? t.fg : t.faint }}>{ghost}</span>
                    <Caret t={t} frame={f} solid />
                  </>
                ) : (
                  <>
                    <Caret t={t} frame={f} solid={f < 70} />
                    {loading && (
                      <span style={{ color: t.faint, fontSize: 8, letterSpacing: 2, opacity: 0.4 + 0.5 * Math.abs(Math.sin(f / 7)) }}> •••</span>
                    )}
                    <span
                      style={{
                        color: t.faint,
                        opacity: swap,
                        filter: `blur(${(1 - swap) * 4}px)`,
                      }}
                    >
                      {ghost}
                    </span>
                    {counter && (
                      <span
                        style={{
                          marginLeft: 6,
                          padding: '0 6px',
                          borderRadius: 999,
                          background: t.selected,
                          color: t.muted,
                          fontFamily: MONO,
                          fontSize: 10.5,
                          verticalAlign: 1,
                        }}
                      >
                        {cycle + 1}/3
                      </span>
                    )}
                  </>
                )}
              </Input>
            </Composer>
            <div style={{ position: 'absolute', top: 160, left: '50%' }}>
              {hud(f, [
                { at: 128, keys: ['⇧', '⇥'], label: 'Next' },
                { at: 158, keys: ['⇥'], label: 'Accept' },
              ])}
            </div>
          </div>
        )
      }}
    </Feature>
  )
}

/* ------------------------------------------------------------------ */

const ISSUES = [
  { id: '128', label: '#128 Menu flickers in Safari', description: 'Open', icon: <IssueIcon />, group: 'Issues', tone: 'orange' as const },
  { id: '131', label: '#131 Caret jumps in Safari 17', description: 'Open', icon: <IssueIcon />, group: 'Issues', tone: 'orange' as const },
  { id: '140', label: '#140 Fix Safari selection', description: 'Merged', icon: <BranchIcon />, group: 'Pull requests', tone: 'teal' as const },
]

export function AsyncResults() {
  return (
    <Feature
      eyebrow="Async search"
      color={t.name === 'light' ? '#e08600' : '#ff9f0a'}
      title={<>Search anything, as you type.</>}
      body={<>Fuzzy matching, groups, debouncing and abort signals. Stale results never flash.</>}
      demoTop={330}
    >
      {(f) => {
        const q = f < 30 ? '' : typed(f, 30, 'safari', 5)
        const loaded = 72
        const enterAt = 150
        const pending = f < enterAt
        const open = sp(f, 24, SNAP)
        const close = range(f, enterAt, enterAt + 9)
        const rows = ISSUES.map((row, i) => ({ ...row, v: sp(f, loaded + i * 5, SNAP) }))
        const active = sp(f, 118, SNAP)
        return (
          <div style={{ position: 'relative' }}>
            <Composer t={t} width={430}>
              <Input t={t}>
                <span>Look at </span>
                {f >= 24 && (
                  <span style={{ position: 'relative' }}>
                    {close < 1 && (
                      <span style={{ position: 'absolute', left: -12, top: 26, zIndex: 5 }}>
                        <Menu
                          t={t}
                          rows={f < loaded ? [] : rows}
                          query={q}
                          active={active}
                          open={open * (1 - close)}
                          width={330}
                          loading={f < loaded + 6 ? f : undefined}
                          style={{ minHeight: 44 }}
                        />
                      </span>
                    )}
                    {pending ? (
                      <>
                        <span style={{ color: t.accent }}>@</span>
                        {q}
                      </>
                    ) : (
                      <Token t={t} tone="orange" label="#131 Caret jumps in Safari 17" icon={<IssueIcon />} age={f - enterAt} />
                    )}
                  </span>
                )}
                <Caret t={t} frame={f} solid={f < 70 || (f > enterAt - 2 && f < enterAt + 10)} />
              </Input>
            </Composer>
            <div style={{ position: 'absolute', top: 320, left: '50%' }}>
              {hud(f, [
                { at: 24, keys: ['@'], label: 'Mention' },
                { at: 116, keys: ['↓'], label: 'Next' },
                { at: enterAt, keys: ['⏎'], label: 'Choose' },
              ])}
            </div>
          </div>
        )
      }}
    </Feature>
  )
}

/* ------------------------------------------------------------------ */

function Screenshot({ w, h }: { w: number; h: number }) {
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: w * 0.08,
        overflow: 'hidden',
        background: '#007aff',
        position: 'relative',
      }}
    >
      <div style={{ position: 'absolute', left: '12%', top: '14%', right: '12%', height: '14%', borderRadius: 4, background: 'rgb(255 255 255 / 0.85)' }} />
      <div style={{ position: 'absolute', left: '12%', top: '38%', width: '46%', bottom: '14%', borderRadius: 4, background: 'rgb(255 255 255 / 0.45)' }} />
      <div style={{ position: 'absolute', right: '12%', top: '38%', width: '26%', bottom: '14%', borderRadius: 4, background: 'rgb(255 255 255 / 0.3)' }} />
    </div>
  )
}

function Attachment({ p, name, detail, progress, preview }: { p: number; name: string; detail: string; progress?: number; preview: ReactNode }) {
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        height: 44,
        padding: '5px 12px 5px 5px',
        overflow: 'hidden',
        borderRadius: 10,
        background: t.hover,
        boxShadow: `inset 0 0 0 1px ${t.border}`,
        transform: `scale(${0.6 + 0.4 * p})`,
        opacity: Math.min(1, p * 1.5),
        transformOrigin: 'left center',
      }}
    >
      <div style={{ width: 34, height: 34, borderRadius: 5, overflow: 'hidden', background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.muted }}>
        {preview}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
        <span style={{ fontSize: 12.5, fontWeight: 600 }}>{name}</span>
        <span style={{ fontSize: 11.5, color: t.muted, fontVariantNumeric: 'tabular-nums' }}>{detail}</span>
      </div>
      {progress !== undefined && progress < 1 && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 2, background: t.accent, transformOrigin: 'left', transform: `scaleX(${progress})` }} />
      )}
    </div>
  )
}

export function Attachments() {
  return (
    <Feature
      eyebrow="Attachments"
      color={t.name === 'light' ? '#ff2d55' : '#ff375f'}
      title={<>Paste it. Drop it. Done.</>}
      body={<>Images and files by paste, drop or picker, with previews and progress. You decide where they go.</>}
      demoTop={380}
    >
      {(f) => {
        const fly = sp(f, 14, { damping: 20, stiffness: 60 })
        const dropAt = 78
        const dropped = f >= dropAt
        const hover = range(f, 50, 60) * (1 - range(f, dropAt, dropAt + 8))
        const strip = sp(f, dropAt, { damping: 20, stiffness: 180 })
        const chip1 = sp(f, dropAt + 2, POP)
        const upload = range(f, dropAt + 6, dropAt + 60, [0, 1], (x) => x)
        const pickPress = f >= 138 && f < 150 ? 1 - Math.abs(f - 142) / 8 : 0
        const chip2 = sp(f, 148, POP)
        const upload2 = range(f, 152, 190, [0, 1], (x) => x)
        const cardX = interpolate(fly, [0, 1], [360, 60])
        const cardY = interpolate(fly, [0, 1], [260, -20])
        const land = sp(f, dropAt, SNAP)
        return (
          <div style={{ position: 'relative' }}>
            <Composer
              t={t}
              width={430}
              focus={0}
              drag={hover}
              attachments={
                <div style={{ height: strip * 54, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', gap: 6, padding: '10px 10px 0' }}>
                    {dropped && (
                      <Attachment
                        p={chip1}
                        name="layout.png"
                        detail={upload < 1 ? `Uploading ${Math.round(upload * 100)}%` : '1.2 MB'}
                        progress={upload}
                        preview={<Screenshot w={34} h={34} />}
                      />
                    )}
                    {f >= 148 && (
                      <Attachment
                        p={chip2}
                        name="spec.pdf"
                        detail={upload2 < 1 ? `Uploading ${Math.round(upload2 * 100)}%` : '240 KB'}
                        progress={upload2}
                        preview={<FileIcon />}
                      />
                    )}
                  </div>
                </div>
              }
              footer={<Footer t={t} attachPress={pickPress} />}
            >
              <Input t={t}>What’s wrong with this layout?</Input>
              {hover > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 3,
                    borderRadius: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `color-mix(in srgb, ${t.bg} 88%, ${t.accent})`,
                    color: t.accent,
                    fontSize: 13,
                    fontWeight: 600,
                    opacity: hover,
                  }}
                >
                  Drop to attach
                </div>
              )}
            </Composer>
            {!dropped || land < 0.99 ? (
              <div
                style={{
                  position: 'absolute',
                  left: dropped ? interpolate(land, [0, 1], [cardX, 14]) : cardX,
                  top: dropped ? interpolate(land, [0, 1], [cardY, 10]) : cardY,
                  zIndex: 5,
                  transform: `rotate(${(1 - fly) * 10 - 3 * (1 - land)}deg) scale(${dropped ? 1 - land * 0.7 : 1})`,
                  transformOrigin: 'top left',
                  opacity: dropped ? 1 - land : Math.min(1, fly * 3),
                  filter: 'drop-shadow(0 6px 14px rgb(0 0 0 / 0.14))',
                }}
              >
                <Screenshot w={120} h={84} />
                <svg width="18" height="22" viewBox="0 0 18 22" style={{ position: 'absolute', right: -8, bottom: -14 }}>
                  <path d="M1 1l15 11.5-6.6 1 3.8 7.2-2.6 1.3-3.8-7.3L1 19.5z" fill="#fff" stroke="#000" strokeWidth="1.2" strokeLinejoin="round" />
                </svg>
              </div>
            ) : null}
          </div>
        )
      }}
    </Feature>
  )
}

/* ------------------------------------------------------------------ */

const KEYS = ['↑', '↓', '⇥', 'esc', '⌫', '⏎']

export function Keyboard() {
  return (
    <Feature
      eyebrow="Keyboard-first"
      color={t.name === 'light' ? '#248a3d' : '#30d158'}
      title={<>Built for keys. Open to everyone.</>}
      body={<>Listbox semantics, live announcements, IME-safe input and reduced motion, out of the box.</>}
      demoTop={380}
    >
      {(f) => {
        const presses: Record<string, Array<number>> = { '⌫': [34, 72], '↓': [118, 138], esc: [164], '⏎': [], '↑': [], '⇥': [] }
        const selected = f >= 34 ? range(f, 34, 40) * 2 : 0
        const remove = range(f, 72, 86)
        const menuAt = 100
        const open = sp(f, menuAt, SNAP)
        const close = range(f, 164, 172)
        const active = sp(f, 118, SNAP) + sp(f, 138, SNAP)
        const pressOf = (k: string) => {
          const hits = presses[k].map((at) => f - at).filter((d) => d >= 0 && d < 14)
          if (hits.length === 0) return { press: 0, lit: 0 }
          const d = hits[0]
          return { press: d < 3 ? d / 3 : 1 - range(d, 3, 10), lit: 1 - range(d, 4, 14) }
        }
        return (
          <div style={{ position: 'relative' }}>
            <Composer t={t} width={430}>
              <Input t={t}>
                <span>Fix </span>
                <Token t={t} label="Composer.tsx" icon={<FileIcon />} />
                <span> using </span>
                {remove < 1 && <Token t={t} tone="green" label="design-system" icon={<FolderIcon />} selected={selected} remove={remove} />}
                {f >= menuAt && (
                  <span style={{ position: 'relative' }}>
                    {close < 1 && (
                      <span style={{ position: 'absolute', left: -12, top: 26, zIndex: 5 }}>
                        <Menu
                          t={t}
                          rows={[
                            { id: 'a', label: 'Ana Ruiz', description: 'Design', icon: <PersonIcon />, group: 'People', tone: 'pink' as const },
                            { id: 'd', label: 'Desmond Lee', description: 'Engineering', icon: <PersonIcon />, group: 'People', tone: 'pink' as const },
                            { id: 'm', label: 'Mei Tanaka', description: 'Product', icon: <PersonIcon />, group: 'People', tone: 'pink' as const },
                          ]}
                          active={active}
                          open={open * (1 - close)}
                          width={260}
                        />
                      </span>
                    )}
                    <span style={{ color: t.accent }}>@</span>
                  </span>
                )}
                <Caret t={t} frame={f} solid={f > 30 && f < 110} />
              </Input>
            </Composer>
            <div
              style={{
                position: 'absolute',
                top: 250,
                left: '50%',
                transform: 'translateX(-50%) scale(0.5)',
                transformOrigin: 'top center',
                display: 'flex',
                gap: 14,
              }}
            >
              {KEYS.map((k) => {
                const { press, lit } = pressOf(k)
                return <Keycap key={k} label={k} size={64} press={press} lit={lit} light={t.name === 'light'} wide={k === 'esc' || k === '⌫'} />
              })}
            </div>
          </div>
        )
      }}
    </Feature>
  )
}

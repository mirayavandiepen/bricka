export type Theme = {
  name: 'dark' | 'light'
  page: string
  pageFg: string
  pageMuted: string
  /** The quiet half of a headline. */
  pageDim: string
  bg: string
  fg: string
  muted: string
  faint: string
  border: string
  borderStrong: string
  hover: string
  selected: string
  accent: string
  focus: string
  shadow: string
  popoverBg: string
  popoverShadow: string
  tokenBg: string
  tokenFg: string
  tokenSelected: string
}

export const light: Theme = {
  name: 'light',
  page: '#f2f2f7',
  pageFg: '#0b0b0c',
  pageMuted: '#6e6e76',
  pageDim: '#b4b4bc',
  bg: '#ffffff',
  fg: '#171717',
  muted: '#66666d',
  faint: '#a1a1a8',
  border: 'rgb(23 23 23 / 0.08)',
  borderStrong: 'rgb(23 23 23 / 0.16)',
  hover: 'rgb(23 23 23 / 0.045)',
  selected: 'rgb(23 23 23 / 0.065)',
  accent: '#2f7df6',
  focus: 'rgb(47 125 246 / 0.14)',
  shadow:
    '0 0 0 1px rgb(23 23 23 / 0.07), 0 1px 2px rgb(23 23 23 / 0.04), 0 8px 24px -12px rgb(23 23 23 / 0.12)',
  popoverBg: '#ffffff',
  popoverShadow:
    '0 0 0 1px rgb(23 23 23 / 0.07), 0 2px 4px rgb(23 23 23 / 0.04), 0 12px 28px -12px rgb(23 23 23 / 0.14)',
  tokenBg: 'rgb(47 125 246 / 0.11)',
  tokenFg: '#1b63d8',
  tokenSelected: 'rgb(47 125 246 / 0.22)',
}

export const dark: Theme = {
  name: 'dark',
  page: '#000000',
  pageFg: '#f5f5f7',
  pageMuted: '#8a8a93',
  pageDim: '#55555c',
  bg: '#18181b',
  fg: '#ededef',
  muted: '#a0a0a8',
  faint: '#6c6c74',
  border: 'rgb(255 255 255 / 0.08)',
  borderStrong: 'rgb(255 255 255 / 0.16)',
  hover: 'rgb(255 255 255 / 0.05)',
  selected: 'rgb(255 255 255 / 0.08)',
  accent: '#5e9bff',
  focus: 'rgb(94 155 255 / 0.22)',
  shadow:
    '0 0 0 1px rgb(255 255 255 / 0.08), inset 0 1px 0 rgb(255 255 255 / 0.04)',
  popoverBg: '#1d1d21',
  popoverShadow:
    '0 0 0 1px rgb(255 255 255 / 0.09), inset 0 1px 0 rgb(255 255 255 / 0.05), 0 18px 44px -12px rgb(0 0 0 / 0.7)',
  tokenBg: 'rgb(94 155 255 / 0.16)',
  tokenFg: '#a8c8ff',
  tokenSelected: 'rgb(94 155 255 / 0.3)',
}

/** Recolour a theme around a new accent, the way --bricka-accent would. */
export function withAccent(theme: Theme, accent: string, tokenFg: string): Theme {
  const bgShare = theme.name === 'dark' ? 16 : 11
  return {
    ...theme,
    accent,
    tokenFg,
    tokenBg: `color-mix(in srgb, ${accent} ${bgShare}%, transparent)`,
    tokenSelected: `color-mix(in srgb, ${accent} ${bgShare * 2}%, transparent)`,
    focus: `color-mix(in srgb, ${accent} ${theme.name === 'dark' ? 22 : 14}%, transparent)`,
  }
}

/** The appearance the video opens in; the themes scene reveals the other. */
export const opening: Theme = light

export function alpha(color: string, percent: number) {
  return `color-mix(in srgb, ${color} ${Math.max(0, Math.min(100, percent))}%, transparent)`
}

/** iOS system colours, one per kind of context, in both appearances. */
export type ToneName = 'blue' | 'green' | 'pink' | 'purple' | 'orange' | 'teal'

const TONES: Record<ToneName, { dark: [string, string]; light: [string, string] }> = {
  // [solid, text]
  blue: { dark: ['#0a84ff', '#a8c8ff'], light: ['#007aff', '#0060d0'] },
  green: { dark: ['#30d158', '#86e8a2'], light: ['#34c759', '#1f7a35'] },
  pink: { dark: ['#ff375f', '#ffa3b6'], light: ['#ff2d55', '#d0183f'] },
  purple: { dark: ['#bf5af2', '#dfb0f8'], light: ['#af52de', '#8a2fba'] },
  orange: { dark: ['#ff9f0a', '#ffc970'], light: ['#ff9500', '#b85f00'] },
  teal: { dark: ['#40c8e0', '#93e4f2'], light: ['#30b0c7', '#0b7d93'] },
}

export type Tone = { solid: string; fg: string; bg: string; selected: string }

/** A tone for this appearance; without a name, the accent drives it. */
export function tone(t: Theme, name?: ToneName): Tone {
  if (!name) return { solid: t.accent, fg: t.tokenFg, bg: t.tokenBg, selected: t.tokenSelected }
  const [solid, fg] = TONES[name][t.name]
  const share = t.name === 'dark' ? 18 : 13
  return {
    solid,
    fg,
    bg: `color-mix(in srgb, ${solid} ${share}%, transparent)`,
    selected: `color-mix(in srgb, ${solid} ${share * 2}%, transparent)`,
  }
}

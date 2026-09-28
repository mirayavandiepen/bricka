import { Easing, interpolate, spring, type SpringConfig } from 'remotion'

export const FPS = 60

/** Bouncy, like a token landing. */
export const POP: Partial<SpringConfig> = { damping: 12, stiffness: 180, mass: 0.8 }
/** Quick and settled, like a menu opening. */
export const SNAP: Partial<SpringConfig> = { damping: 22, stiffness: 260, mass: 0.9 }
/** Springy but controlled, for big type. */
export const SPRING: Partial<SpringConfig> = { damping: 16, stiffness: 140, mass: 1 }
/** No overshoot. */
export const SMOOTH: Partial<SpringConfig> = { damping: 200, stiffness: 100, mass: 1 }

export function sp(frame: number, delay = 0, config: Partial<SpringConfig> = SPRING) {
  return spring({ frame: frame - delay, fps: FPS, config })
}

export const easeOut = Easing.bezier(0.16, 1, 0.3, 1)
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1)

/** Clamped interpolate between two frames, eased out by default. */
export function range(
  frame: number,
  from: number,
  to: number,
  out: [number, number] = [0, 1],
  easing: (t: number) => number = easeOut
) {
  return interpolate(frame, [from, to], out, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing,
  })
}

/** Blur-up reveal styles for a 0..1 progress. */
export function reveal(p: number, distance = 30, blur = 12) {
  return {
    opacity: Math.min(1, Math.max(0, p)),
    transform: `translateY(${(1 - p) * distance}px)`,
    filter: `blur(${Math.max(0, (1 - p) * Math.min(blur, 4))}px)`,
  } as const
}

/** Scene in/out envelope: returns 0..1 in, and 0..1 out. */
export function envelope(frame: number, duration: number, outLength = 18) {
  const out = range(frame, duration - outLength, duration, [0, 1], Easing.in(Easing.cubic))
  return out
}

/** Characters of `text` visible at `frame` when typed from `start`. */
export function typed(frame: number, start: number, text: string, speed = 3) {
  if (frame < start) return ''
  return text.slice(0, Math.min(text.length, Math.floor((frame - start) / speed) + 1))
}

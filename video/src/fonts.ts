import { loadFont } from '@remotion/fonts'
import { staticFile } from 'remotion'

const weights = {
  Regular: '400',
  Medium: '500',
  SemiBold: '600',
  Bold: '700',
  ExtraBold: '800',
  Black: '900',
} as const

for (const [name, weight] of Object.entries(weights)) {
  void loadFont({
    family: 'Sunghyun Sans',
    url: staticFile(`fonts/SunghyunSans-${name}.woff2`),
    weight,
  })
}

export const SANS = "'Sunghyun Sans', -apple-system, 'SF Pro Display', sans-serif"
export const MONO = "ui-monospace, 'SF Mono', 'JetBrains Mono', Menlo, monospace"

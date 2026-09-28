import type { ComponentType } from 'react'
import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion'
import './fonts'
import { Background } from './ui'
import { dark, opening } from './theme'
import { Intro } from './scenes/Intro'
import { Kinetic } from './scenes/Kinetic'
import { Demo } from './scenes/Demo'
import { Receives } from './scenes/Receives'
import { Autocomplete, AsyncResults, Attachments, Keyboard } from './scenes/Features'
import { Exploded } from './scenes/Exploded'
import { Themes } from './scenes/Themes'
import { Outro } from './scenes/Outro'

type Scene = { name: string; component: ComponentType; duration: number; overlap?: number }

export const SCENES: Array<Scene> = [
  { name: 'Intro', component: Intro, duration: 200 },
  { name: 'Kinetic', component: Kinetic, duration: 196, overlap: 14 },
  { name: 'Demo', component: Demo, duration: 390, overlap: 8 },
  { name: 'Receives', component: Receives, duration: 260, overlap: 34 },
  { name: 'Autocomplete', component: Autocomplete, duration: 210, overlap: 10 },
  { name: 'AsyncResults', component: AsyncResults, duration: 200, overlap: 10 },
  { name: 'Attachments', component: Attachments, duration: 220, overlap: 10 },
  { name: 'Keyboard', component: Keyboard, duration: 205, overlap: 10 },
  { name: 'Exploded', component: Exploded, duration: 270, overlap: 10 },
  { name: 'Themes', component: Themes, duration: 370, overlap: 12 },
  { name: 'Outro', component: Outro, duration: 360, overlap: 14 },
]

export function timeline() {
  let at = 0
  return SCENES.map((scene, i) => {
    const from = i === 0 ? 0 : at - (scene.overlap ?? 0)
    at = from + scene.duration
    return { ...scene, from }
  })
}

export const TOTAL = (() => {
  const t = timeline()
  const last = t[t.length - 1]
  return last.from + last.duration
})()

export function Video() {
  const frame = useCurrentFrame()
  const themes = timeline().find((scene) => scene.name === 'Themes')!
  // The themes scene hands back to the opening appearance for the outro.
  const page = frame < themes.from + themes.duration / 2 ? opening : dark
  return (
    <AbsoluteFill style={{ background: page.page }}>
      <Background t={page} frame={frame} />
      {timeline().map((scene) => (
        <Sequence key={scene.name} name={scene.name} from={scene.from} durationInFrames={scene.duration}>
          <scene.component />
        </Sequence>
      ))}
    </AbsoluteFill>
  )
}

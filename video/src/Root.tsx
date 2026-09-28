import { Composition } from 'remotion'
import { FPS } from './anim'
import { TOTAL, Video } from './Video'

export function Root() {
  return (
    <Composition
      id="Bricka"
      component={Video}
      durationInFrames={TOTAL}
      fps={FPS}
      width={1920}
      height={1080}
    />
  )
}

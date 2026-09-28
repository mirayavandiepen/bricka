import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { SMOOTH, range, sp } from '../anim'
import { SANS } from '../fonts'
import {
  DocumentIcon,
  EyeIcon,
  FileIcon,
  FlaskIcon,
  FolderIcon,
  PersonIcon,
  SparkIcon,
  WrenchIcon,
} from '../icons'
import { play, type Step } from '../script'
import { opening } from '../theme'
import { Caret, Captions, Composer, Footer, Input, Kbd, KeyHud } from '../ui'

const t = opening

export const FILES = [
  { id: 'c', label: 'Composer.tsx', description: 'src/components', icon: <FileIcon />, group: 'Files', tone: 'blue' as const },
  { id: 'u', label: 'use-composer.ts', description: 'src/hooks', icon: <FileIcon />, group: 'Files', tone: 'blue' as const },
  { id: 't', label: 'tokens.css', description: 'src/styles', icon: <FileIcon />, group: 'Files', tone: 'blue' as const },
  { id: 'p', label: 'package.json', description: 'Root', icon: <FileIcon />, group: 'Files', tone: 'blue' as const },
  { id: 'a', label: 'Ana Ruiz', description: 'Design', icon: <PersonIcon />, group: 'People', tone: 'pink' as const },
]

const CONTEXT = [
  { id: 'ds', label: 'design-system', description: 'Docs', icon: <FolderIcon />, group: 'Docs', tone: 'green' as const },
  { id: 'dt', label: 'design-tokens.md', description: 'Docs', icon: <DocumentIcon />, group: 'Docs', tone: 'green' as const },
  { id: 'dl', label: 'Desmond Lee', description: 'Engineering', icon: <PersonIcon />, group: 'People', tone: 'pink' as const },
  { id: 'ar', label: 'Ana Ruiz', description: 'Design', icon: <PersonIcon />, group: 'People', tone: 'pink' as const },
]

export const COMMANDS = [
  { id: 'acc', label: 'accessibility', description: 'Audit for a11y', icon: <EyeIcon />, tone: 'purple' as const },
  { id: 'test', label: 'test', description: 'Run the tests', icon: <FlaskIcon />, tone: 'teal' as const },
  { id: 'rev', label: 'review', description: 'Review the diff', icon: <SparkIcon />, tone: 'orange' as const },
  { id: 'fix', label: 'fix', description: 'Fix lint errors', icon: <WrenchIcon />, tone: 'pink' as const },
]

const STEPS: Array<Step> = [
  { kind: 'type', text: 'Fix ', at: 40, speed: 3 },
  {
    kind: 'pick',
    trigger: '@',
    query: 'Comp',
    at: 58,
    enterAt: 102,
    rows: FILES,
    token: { label: 'Composer.tsx', icon: <FileIcon /> },
  },
  { kind: 'type', text: ' using ', at: 116, speed: 3 },
  {
    kind: 'pick',
    trigger: '@',
    query: 'des',
    at: 144,
    enterAt: 180,
    rows: CONTEXT,
    token: { label: 'design-system', icon: <FolderIcon />, tone: 'green' },
  },
  { kind: 'type', text: ' and check ', at: 194, speed: 3 },
  {
    kind: 'pick',
    trigger: '/',
    query: 'acc',
    at: 236,
    enterAt: 272,
    rows: COMMANDS,
    token: { label: 'accessibility', tone: 'purple' },
    menuWidth: 280,
    menuLeft: -150,
  },
]

const SEND = 304

const caption = (text: React.ReactNode) => (
  <div
    style={{
      fontFamily: SANS,
      fontSize: 66,
      fontWeight: 700,
      letterSpacing: '-0.035em',
      color: t.pageFg,
    }}
  >
    {text}
  </div>
)
const dim = { color: t.pageDim }

export function Demo() {
  const f = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()
  const { nodes, isTyping, isEmpty } = play(f, STEPS, t)

  const enter = sp(f, 0, { damping: 18, stiffness: 120 })
  const focus = range(f, 18, 34)
  const press = f >= SEND + 2 && f < SEND + 16 ? 1 - range(f, SEND + 4, SEND + 16) : 0
  const lift = sp(f, SEND + 8, SMOOTH)
  const isSent = f >= SEND + 34
  const exit = range(f, durationInFrames - 46, durationInFrames - 26)
  const captionOut = range(f, SEND + 34, SEND + 50)
  const zoom = 2.1 + range(f, 0, SEND, [0, 0.12])

  return (
    <AbsoluteFill>
      <Captions
        frame={f}
        style={{
          top: 150,
          // Clear the stage before the next scene's headline arrives.
          opacity: 1 - captionOut,
          transform: `translateY(${-captionOut * 30}px)`,
          filter: `blur(${captionOut * 3}px)`,
        }}
        cues={[
          { from: 6, content: caption(<>Pull files <span style={dim}>into the message.</span></>) },
          { from: 118, content: caption(<>Docs, people, <span style={dim}>anything.</span></>) },
          { from: 212, content: caption(<>Commands with <Kbd t={t} tone="neutral">/</Kbd></>) },
          { from: SEND - 6, content: caption(<>Enter. <span style={dim}>Sent.</span></>) },
        ]}
      />

      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 370,
          transformOrigin: 'top center',
          transform: `translateX(-50%) translateY(${(1 - enter) * 120 + exit * 40}px) scale(${zoom * (0.9 + 0.1 * enter) * (1 - exit * 0.08)})`,
          opacity: Math.min(1, enter * 1.5) * (1 - exit),
          filter: `blur(${exit * 3}px)`,
        }}
      >
        <Composer
          t={t}
          width={610}
          focus={focus}
          footer={<Footer t={t} enabled={!isEmpty && !isSent ? 1 : 0} press={press} />}
        >
          <Input t={t} placeholder={isEmpty || isSent ? 'Ask anything, @ to add context' : undefined}>
            <span
              style={{
                display: 'inline-block',
                opacity: isSent ? 0 : 1 - lift,
                transform: `translateY(${-lift * 46}px) scale(${1 - lift * 0.04})`,
                filter: `blur(${lift * 3}px)`,
              }}
            >
              {!isSent && nodes}
              {!isSent && <Caret t={t} frame={f} solid={isTyping} hidden={f < 18 || f > SEND} />}
            </span>
            {isSent && <Caret t={t} frame={f} solid={false} />}
          </Input>
        </Composer>
      </div>

      <KeyHud
        frame={f}
        light={t.name === 'light'}
        style={{ bottom: 70 }}
        events={[
          { at: 58, keys: ['@'], label: 'Mention' },
          { at: 102, keys: ['⏎'], label: 'Choose' },
          { at: 144, keys: ['@'], label: 'Mention' },
          { at: 180, keys: ['⏎'], label: 'Choose' },
          { at: 236, keys: ['/'], label: 'Command' },
          { at: 272, keys: ['⏎'], label: 'Choose' },
          { at: SEND, keys: ['⏎'], label: 'Send' },
        ]}
      />
    </AbsoluteFill>
  )
}

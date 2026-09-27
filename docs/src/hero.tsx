import {
  CODING_EXAMPLE_VALUE,
  CodingAssistant,
} from '@examples/coding-assistant'
import { MessagePreview } from '@examples/parts'
import {
  getText,
  type ComposerApi,
  type ComposerMessage,
  type ComposerValue,
  type TokenSegment,
} from '@inlay/react'
import { AtSign, Delete, Slash } from 'lucide-react'
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react'

function Readout({ value }: { value: ComposerValue }) {
  const tokens = value.filter(
    (segment): segment is TokenSegment => segment.type === 'token'
  )
  const text = getText(value)
  return (
    <dl className="readout" aria-label="What your app receives">
      <div>
        <dt>getText()</dt>
        <dd className="readout-text">
          {text || <span className="readout-empty">empty</span>}
        </dd>
      </div>
      <div>
        <dt>tokens</dt>
        <dd className="readout-tokens">
          {tokens.length === 0 && <span className="readout-empty">none</span>}
          {tokens.map((token, index) => (
            <span key={index} className="readout-token">
              <span>
                {token.item.type ??
                  (token.trigger === '/' ? 'command' : 'item')}
              </span>
              {token.item.id}
            </span>
          ))}
        </dd>
      </div>
    </dl>
  )
}

type Frame = { value: ComposerValue; delay: number }

/**
 * The demo message, typed out a keystroke at a time. Typing `@Comp` or `/te`
 * turns into a token a beat later, the way picking from the menu does.
 */
function typingFrames(): Array<Frame> {
  const [lead, file, middle, command, tail] = CODING_EXAMPLE_VALUE
  const frames: Array<Frame> = []
  let done: ComposerValue = []

  function type(text: string, speed = 34) {
    for (let index = 1; index <= text.length; index++) {
      // A little unevenness reads as a person, not a printer.
      const delay = speed + ((index * 37) % 5) * 9
      frames.push({
        value: [...done, { type: 'text', text: text.slice(0, index) }],
        delay,
      })
    }
  }

  function commit(segment: ComposerValue[number], delay: number) {
    done = [...done, segment]
    frames.push({ value: done, delay })
  }

  if (lead.type !== 'text' || middle.type !== 'text' || tail.type !== 'text')
    return frames

  type(lead.text)
  commit(lead, 0)
  type('@Comp', 90)
  commit(file, 520)
  type(middle.text)
  commit(middle, 0)
  type('/te', 90)
  commit(command, 520)
  type(tail.text)
  commit(tail, 0)
  return frames
}

const FRAMES = typingFrames()
const FINAL = FRAMES[FRAMES.length - 1].value

/** The hints pop in first, one after another, then typing starts. */
const HINTS_AT = 850
const HINT_GAP = 130
const TYPING_AT = HINTS_AT + HINT_GAP * 4 + 450

type Point = { x: number; y: number }

/** Where the caret would be: the end of the input's text, relative to `stage`. */
function caretPoint(stage: HTMLElement): Point | null {
  const input = stage.querySelector('.inlay-input')
  if (!input) return null
  const walker = document.createTreeWalker(input, NodeFilter.SHOW_TEXT)
  let last: Text | null = null
  while (walker.nextNode()) {
    const node = walker.currentNode as Text
    if (node.data.length > 0) last = node
  }
  if (!last) return null
  const range = document.createRange()
  range.setStart(last, last.data.length)
  range.collapse(true)
  const rect = range.getClientRects()[0] ?? range.getBoundingClientRect()
  const origin = stage.getBoundingClientRect()
  return { x: rect.right - origin.left, y: rect.top - origin.top }
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Plays the demo, and stops the moment someone steps in. */
function useTypingDemo(
  composer: RefObject<ComposerApi | null>,
  stage: RefObject<HTMLElement | null>
) {
  const [hints, setHints] = useState(0)
  const [caret, setCaret] = useState<Point | null>(null)

  useEffect(() => {
    if (prefersReducedMotion()) {
      composer.current?.setValue(FINAL)
      setHints(HINTS.length)
      return
    }

    const timers: Array<ReturnType<typeof setTimeout>> = []
    let frame = 0
    let isDone = false

    for (let index = 1; index <= HINTS.length; index++) {
      timers.push(
        setTimeout(() => setHints(index), HINTS_AT + (index - 1) * HINT_GAP)
      )
    }

    function step() {
      const current = FRAMES[frame]
      composer.current?.setValue(current.value)
      // Measure once the composer has painted the new text.
      const measure = setTimeout(() => {
        const element = stage.current
        const point = element && caretPoint(element)
        setCaret(point)
      }, 16)
      timers.push(measure)
      frame += 1
      if (frame < FRAMES.length) {
        timers.push(setTimeout(step, FRAMES[frame].delay))
      } else {
        isDone = true
        timers.push(setTimeout(() => setCaret(null), 900))
      }
    }
    timers.push(setTimeout(step, TYPING_AT))

    // Finish the message so there's something whole to play with.
    function takeOver() {
      for (const timer of timers) clearTimeout(timer)
      if (!isDone) composer.current?.setValue(FINAL)
      setHints(HINTS.length)
      setCaret(null)
    }
    const element = stage.current
    element?.addEventListener('pointerdown', takeOver, { once: true })
    element?.addEventListener('focusin', takeOver, { once: true })
    return () => {
      for (const timer of timers) clearTimeout(timer)
      element?.removeEventListener('pointerdown', takeOver)
      element?.removeEventListener('focusin', takeOver)
    }
  }, [composer, stage])

  return { hints, caret }
}

const HINTS: Array<{ tone: string; content: ReactNode }> = [
  {
    tone: 'blue',
    content: (
      <>
        <span className="pill-key">
          <AtSign size={13} strokeWidth={2.75} />
        </span>
        add context
      </>
    ),
  },
  {
    tone: 'green',
    content: (
      <>
        <span className="pill-key">
          <Slash size={13} strokeWidth={2.75} />
        </span>
        commands
      </>
    ),
  },
  {
    tone: 'orange',
    content: (
      <>
        type <q>why does</q>, then
        <span className="pill-key pill-key-wide">Tab</span>
      </>
    ),
  },
  {
    tone: 'yellow',
    content: (
      <>
        <span className="pill-key">
          <Delete size={14} strokeWidth={2.5} />
        </span>
        twice removes a token
      </>
    ),
  },
]

export function Hero() {
  const [value, setValue] = useState<ComposerValue>([])
  const [message, setMessage] = useState<ComposerMessage | null>(null)
  const composer = useRef<ComposerApi>(null)
  const stage = useRef<HTMLDivElement>(null)
  const { hints, caret } = useTypingDemo(composer, stage)

  return (
    <section className="hero" id="introduction" aria-labelledby="hero-title">
      <p className="hero-tag">@inlay/react · v0.1</p>
      <h1 id="hero-title">
        {['Type it.', 'Tag it.', 'Send it.'].map((phrase, index) => (
          <span
            key={phrase}
            className="hero-phrase"
            style={{ '--i': index } as CSSProperties}
          >
            {phrase}
          </span>
        ))}
      </h1>
      <p className="hero-lede">
        The input for AI apps. Pull files, people and tools right into the
        message.
      </p>
      <div className="hero-demo">
        <div className="stage" ref={stage}>
          <CodingAssistant
            composerRef={composer}
            onValueChange={setValue}
            onSend={setMessage}
          />
          {caret && (
            <span
              className="demo-caret"
              style={{ left: caret.x, top: caret.y }}
              aria-hidden
            />
          )}
          <ul className="hero-hints" aria-label="Try it">
            {HINTS.map((hint, index) => (
              <li
                key={hint.tone}
                className={`pill pill-${hint.tone}`}
                data-shown={index < hints || undefined}
              >
                {hint.content}
              </li>
            ))}
          </ul>
        </div>
        <Readout value={value} />
        {message && <MessagePreview message={message} />}
      </div>
    </section>
  )
}

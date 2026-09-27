import {
  CODING_EXAMPLE_VALUE,
  CodingAssistant,
} from '@examples/coding-assistant'
import { MessagePreview } from '@examples/parts'
import {
  getText,
  type ComposerMessage,
  type ComposerValue,
  type TokenSegment,
} from '@inlay/react'
import { useState } from 'react'

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

export function Hero() {
  const [value, setValue] = useState<ComposerValue>(CODING_EXAMPLE_VALUE)
  const [message, setMessage] = useState<ComposerMessage | null>(null)

  return (
    <section className="hero" id="introduction" aria-labelledby="hero-title">
      <h1 id="hero-title">Inlay</h1>
      <p className="hero-lede">
        A composable input for AI apps. People type naturally and pull files,
        people, tools and commands into the message as structured context.
      </p>
      <div className="hero-demo">
        <CodingAssistant
          defaultValue={CODING_EXAMPLE_VALUE}
          onValueChange={setValue}
          onSend={setMessage}
        />
        <ul className="hero-hints" aria-label="Try it">
          <li>
            <kbd>@</kbd> add context
          </li>
          <li>
            <kbd>/</kbd> commands
          </li>
          <li>
            type <q>why does</q> and pause, then <kbd>Tab</kbd>
          </li>
          <li>
            <kbd>⌫</kbd> <kbd>⌫</kbd> removes a token
          </li>
        </ul>
        <Readout value={value} />
        {message && <MessagePreview message={message} />}
      </div>
    </section>
  )
}

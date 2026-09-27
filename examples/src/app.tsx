import type { ComposerMessage } from '@bricka/react'
import { useEffect, useState, type ComponentType, type ReactNode } from 'react'
import { AgentComposer } from './agent-composer'
import { CodingAssistant } from './coding-assistant'
import { MessagePreview } from './parts'
import { WritingAssistant } from './writing-assistant'

type Hint = { keys: ReactNode; text: string }

type Example = {
  id: string
  title: string
  hints: Array<Hint>
  Component: ComponentType<{ onSend?: (message: ComposerMessage) => void }>
}

const EXAMPLES: Array<Example> = [
  {
    id: 'coding',
    title: 'Coding assistant',
    hints: [
      { keys: <kbd>@</kbd>, text: 'files, issues and tools' },
      { keys: <kbd>/</kbd>, text: 'commands' },
      { keys: <kbd>⌘K</kbd>, text: 'open commands' },
      { keys: <kbd>Tab</kbd>, text: 'accept a suggestion' },
    ],
    Component: CodingAssistant,
  },
  {
    id: 'writing',
    title: 'Writing assistant',
    hints: [
      { keys: <kbd>@</kbd>, text: 'documents and people' },
      { keys: <kbd>/</kbd>, text: 'actions' },
      { keys: <kbd>⌘↵</kbd>, text: 'send' },
    ],
    Component: WritingAssistant,
  },
  {
    id: 'agent',
    title: 'Agent composer',
    hints: [
      { keys: <kbd>@</kbd>, text: 'agents' },
      { keys: <kbd>#</kbd>, text: 'resources, loaded slowly' },
      { keys: <kbd>/</kbd>, text: 'tools' },
      { keys: <kbd>/clear</kbd>, text: 'runs an action' },
    ],
    Component: AgentComposer,
  },
]

type Theme = 'system' | 'light' | 'dark'

/** Flip the page between themes to check both without changing the OS. */
function ThemeSwitch() {
  const [theme, setTheme] = useState<Theme>('system')
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') delete root.dataset.theme
    else root.dataset.theme = theme
  }, [theme])

  return (
    <div className="theme-switch" role="radiogroup" aria-label="Theme">
      {(['system', 'light', 'dark'] as const).map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={theme === option}
          onClick={() => setTheme(option)}
        >
          {option[0].toUpperCase() + option.slice(1)}
        </button>
      ))}
    </div>
  )
}

function ExampleSection({ example }: { example: Example }) {
  const [message, setMessage] = useState<ComposerMessage | null>(null)
  const { Component } = example
  return (
    <section className="page-section" aria-labelledby={`${example.id}-title`}>
      <h2 id={`${example.id}-title`}>{example.title}</h2>
      <ul className="hints" aria-label="Try">
        {example.hints.map((hint) => (
          <li key={hint.text}>
            {hint.keys}
            <span>{hint.text}</span>
          </li>
        ))}
      </ul>
      <div className="example">
        <Component onSend={setMessage} />
        <MessagePreview message={message} />
      </div>
    </section>
  )
}

export function App() {
  return (
    <main className="page">
      <header className="page-header">
        <div>
          <h1>Bricka examples</h1>
          <p>Three composers built from the same parts.</p>
        </div>
        <ThemeSwitch />
      </header>
      {EXAMPLES.map((example) => (
        <ExampleSection key={example.id} example={example} />
      ))}
    </main>
  )
}

import type { ComposerMessage } from '@bricka/react'
import { useState, type ComponentType } from 'react'
import { AgentComposer } from './agent-composer'
import { CodingAssistant } from './coding-assistant'
import { MessagePreview } from './parts'
import { WritingAssistant } from './writing-assistant'

type Example = {
  id: string
  title: string
  hint: string
  Component: ComponentType<{ onSend?: (message: ComposerMessage) => void }>
}

const EXAMPLES: Array<Example> = [
  {
    id: 'coding',
    title: 'Coding assistant',
    hint: '@ files, issues and tools · / commands · ⌘K · pause for suggestions',
    Component: CodingAssistant,
  },
  {
    id: 'writing',
    title: 'Writing assistant',
    hint: '@ documents and people · / actions · streamed suggestions · ⌘↵ sends',
    Component: WritingAssistant,
  },
  {
    id: 'agent',
    title: 'Agent composer',
    hint: '@ agents · # resources (async) · / tools · /clear runs an action',
    Component: AgentComposer,
  },
]

function ExampleSection({ example }: { example: Example }) {
  const [message, setMessage] = useState<ComposerMessage | null>(null)
  const { Component } = example
  return (
    <section className="page-section" aria-labelledby={`${example.id}-title`}>
      <h2 id={`${example.id}-title`}>{example.title}</h2>
      <p>{example.hint}</p>
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
        <h1>Bricka examples</h1>
        <p>Three composers built from the same primitives.</p>
      </header>
      {EXAMPLES.map((example) => (
        <ExampleSection key={example.id} example={example} />
      ))}
    </main>
  )
}

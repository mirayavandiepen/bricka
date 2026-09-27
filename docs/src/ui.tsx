import { useId, useRef, useState, type ReactNode } from 'react'

/**
 * Subsections one at a time, so a section stays one screen tall. `tabs` is a
 * segmented control for a few short labels; `list` is a side menu for many.
 */
export function Topics({
  label,
  items,
  variant = 'tabs',
}: {
  label: string
  items: Array<{ id: string; label: string; content: ReactNode }>
  variant?: 'tabs' | 'list'
}) {
  const isList = variant === 'list'
  const [active, setActive] = useState(items[0].id)
  const buttons = useRef<Array<HTMLButtonElement | null>>([])
  const baseId = useId()
  const current = items.find((item) => item.id === active) ?? items[0]

  function move(offset: number) {
    const index = items.findIndex((item) => item.id === active)
    const next = (index + offset + items.length) % items.length
    setActive(items[next].id)
    buttons.current[next]?.focus()
  }

  return (
    <div className="topics" data-variant={variant}>
      <div
        className={isList ? 'topic-list' : 'tabs'}
        role="tablist"
        aria-label={label}
        aria-orientation={isList ? 'vertical' : 'horizontal'}
        onKeyDown={(event) => {
          const next = isList ? 'ArrowDown' : 'ArrowRight'
          const previous = isList ? 'ArrowUp' : 'ArrowLeft'
          if (event.key === next) move(1)
          else if (event.key === previous) move(-1)
          else return
          event.preventDefault()
        }}
      >
        {items.map((item, index) => (
          <button
            key={item.id}
            ref={(element) => {
              buttons.current[index] = element
            }}
            id={`${baseId}-tab-${item.id}`}
            type="button"
            role="tab"
            aria-selected={item.id === current.id}
            aria-controls={`${baseId}-panel`}
            tabIndex={item.id === current.id ? 0 : -1}
            onClick={() => setActive(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div
        id={`${baseId}-panel`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${current.id}`}
        className="topic-panel"
        key={current.id}
      >
        {current.content}
      </div>
    </div>
  )
}

export type Fact = { title: string; children: ReactNode }

/** Short points in place of paragraphs: one idea each. */
export function Facts({ items }: { items: Array<Fact> }) {
  return (
    <dl className="facts">
      {items.map(({ title, children }) => (
        <div key={title}>
          <dt>{title}</dt>
          <dd>{children}</dd>
        </div>
      ))}
    </dl>
  )
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="note">{children}</p>
}

export function Steps({
  items,
}: {
  items: Array<{ title: string; content: ReactNode }>
}) {
  return (
    <ol className="steps">
      {items.map((item) => (
        <li key={item.title}>
          <h3>{item.title}</h3>
          {item.content}
        </li>
      ))}
    </ol>
  )
}

/** Key combinations beside what they do, one per row. */
export function KeyGrid({
  items,
}: {
  items: Array<{ keys: ReactNode; action: ReactNode }>
}) {
  return (
    <dl className="key-grid">
      {items.map(({ keys, action }, index) => (
        <div key={index}>
          <dt>{keys}</dt>
          <dd>{action}</dd>
        </div>
      ))}
    </dl>
  )
}

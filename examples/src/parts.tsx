import { serialize, type ComposerMessage, type Segment } from '@inlay/react'
import { useState } from 'react'
import './examples.css'

export function ModelSelect({
  models,
  value,
  onChange,
}: {
  models: Array<string>
  value: string
  onChange: (model: string) => void
}) {
  return (
    <label className="example-select">
      <span className="example-sr-only">Model</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {models.map((model) => (
          <option key={model}>{model}</option>
        ))}
      </select>
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
        <path
          d="M2.5 4l2.5 2.5L7.5 4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      </svg>
    </label>
  )
}

function Content({ value }: { value: Array<Segment> }) {
  return (
    <>
      {value.map((segment, index) =>
        segment.type === 'text' ? (
          <span key={index}>{segment.text}</span>
        ) : (
          <span
            key={index}
            className="example-chip"
            data-trigger={segment.trigger}
          >
            {segment.trigger === '/' ? '/' : null}
            {segment.item.label}
          </span>
        )
      )}
    </>
  )
}

/** The last submitted message, as the host app would receive it. */
export function MessagePreview({
  message,
}: {
  message: ComposerMessage | null
}) {
  const [view, setView] = useState<'message' | 'json'>('message')
  if (!message) {
    return (
      <p className="example-preview-empty">
        Send a message to see what your app receives.
      </p>
    )
  }
  return (
    <div className="example-preview">
      <div
        className="example-preview-tabs"
        role="tablist"
        aria-label="Output format"
      >
        {(['message', 'json'] as const).map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={view === tab}
            onClick={() => setView(tab)}
          >
            {tab === 'message' ? 'Message' : 'JSON'}
          </button>
        ))}
      </div>
      {view === 'message' ? (
        <div className="example-preview-body">
          <p className="example-preview-text">
            <Content value={message.value} />
          </p>
          {message.attachments.length > 0 && (
            <p className="example-preview-meta">
              {message.attachments.map((a) => a.name).join(', ')}
            </p>
          )}
          <code className="example-preview-plain">{message.text || '—'}</code>
        </div>
      ) : (
        <pre className="example-preview-json">
          {JSON.stringify(
            {
              text: message.text,
              value: serialize(message.value),
              attachments: message.attachments.map(
                ({ id, name, mimeType, size }) => ({
                  id,
                  name,
                  mimeType,
                  size,
                })
              ),
            },
            null,
            2
          )}
        </pre>
      )}
    </div>
  )
}

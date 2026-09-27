import type { CSSProperties } from 'react'
import type { GhostState } from './use-autocomplete'

type GhostTextProps = {
  ghost: GhostState
  onAccept: () => void
}

/** Suggestion text painted after the caret, outside the editable DOM. */
export function GhostText({ ghost, onAccept }: GhostTextProps) {
  const { layout, typography, suggestions, index, status } = ghost
  const text = suggestions[index] ?? ''
  const style: CSSProperties = {
    ...typography,
    position: 'absolute',
    top: layout.top,
    left: layout.left,
    minHeight: layout.height,
    width: layout.wrap?.width,
    textIndent: layout.wrap?.indent,
    whiteSpace: layout.wrap ? 'pre-wrap' : 'pre',
    overflowWrap: layout.wrap ? 'break-word' : undefined,
    pointerEvents: 'none',
  }

  return (
    <div className="inlay-ghost" data-status={status} style={style} aria-hidden>
      {text.length === 0 ? (
        <span className="inlay-ghost-loading" />
      ) : (
        <span
          className="inlay-ghost-text"
          onPointerDown={(event) => {
            event.preventDefault()
            onAccept()
          }}
        >
          {text}
        </span>
      )}
      {suggestions.length > 1 && (
        <span className="inlay-ghost-count">
          {index + 1}/{suggestions.length}
        </span>
      )}
    </div>
  )
}

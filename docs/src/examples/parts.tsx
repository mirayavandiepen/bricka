import {
  serialize,
  type ComposerMessage,
  type Segment,
} from '@mirayavandiepen/bricka'
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import { createPortal } from 'react-dom'
import './examples.css'

export type PickerOption = { value: string; description?: string }

type Placement = { top: number; left: number; placement: 'above' | 'below' }

const PICKER_WIDTH = 240
const PICKER_GAP = 6
const PICKER_MARGIN = 8

/** Opens above the button when there's no room below, and stays on screen. */
function placePicker(button: HTMLElement, height: number): Placement {
  const rect = button.getBoundingClientRect()
  const below = window.innerHeight - rect.bottom - PICKER_GAP - PICKER_MARGIN
  const above = rect.top - PICKER_GAP - PICKER_MARGIN
  const placement = below >= height || below >= above ? 'below' : 'above'
  const left = Math.min(
    Math.max(rect.left, PICKER_MARGIN),
    window.innerWidth - PICKER_WIDTH - PICKER_MARGIN
  )
  return {
    placement,
    left,
    top:
      placement === 'below' ? rect.bottom + PICKER_GAP : rect.top - PICKER_GAP,
  }
}

/**
 * A select in the composer footer: a button that opens a listbox popover.
 * Follows the select-only combobox pattern: arrow keys, Home/End and
 * type-to-jump move through options; Enter or Space picks; Escape, Tab or a
 * click outside closes and hands focus back to the button.
 */
export function ModelSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: Array<PickerOption>
  value: string
  onChange: (value: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [place, setPlace] = useState<Placement | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const typed = useRef({ text: '', at: 0 })
  const id = useId()
  const selected = Math.max(
    0,
    options.findIndex((option) => option.value === value)
  )

  function open(start = selected) {
    setActive(start)
    setIsOpen(true)
  }

  function close(returnFocus = true) {
    setIsOpen(false)
    if (returnFocus) buttonRef.current?.focus()
  }

  function pick(index: number) {
    onChange(options[index].value)
    close()
  }

  // Place before paint, then keep it pinned to the button while the page moves.
  useLayoutEffect(() => {
    if (!isOpen) return
    const list = listRef.current
    const button = buttonRef.current
    if (!list || !button) return
    const update = () => setPlace(placePicker(button, list.offsetHeight))
    update()
    list.focus({ preventScroll: true })
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node
      if (listRef.current?.contains(target)) return
      if (buttonRef.current?.contains(target)) return
      close(false)
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    return () =>
      document.removeEventListener('pointerdown', onPointerDown, true)
  }, [isOpen])

  function onListKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const last = options.length - 1
    switch (event.key) {
      case 'ArrowDown':
        setActive((index) => Math.min(index + 1, last))
        break
      case 'ArrowUp':
        setActive((index) => Math.max(index - 1, 0))
        break
      case 'Home':
        setActive(0)
        break
      case 'End':
        setActive(last)
        break
      case 'Enter':
      case ' ':
        pick(active)
        break
      case 'Escape':
        close()
        break
      case 'Tab':
        // Let focus move on naturally; just close behind it.
        setIsOpen(false)
        return
      default: {
        if (event.key.length !== 1 || event.metaKey || event.ctrlKey) return
        const now = Date.now()
        const text =
          (now - typed.current.at < 500 ? typed.current.text : '') +
          event.key.toLowerCase()
        typed.current = { text, at: now }
        const match = options.findIndex((option) =>
          option.value.toLowerCase().startsWith(text)
        )
        if (match >= 0) setActive(match)
        return
      }
    }
    event.preventDefault()
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="example-select"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? `${id}-list` : undefined}
        aria-label={`${label}: ${value}`}
        data-open={isOpen || undefined}
        onClick={() => (isOpen ? close() : open())}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            open(event.key === 'ArrowUp' ? options.length - 1 : selected)
          }
        }}
      >
        {value}
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
          <path
            d="M2.5 4l2.5 2.5L7.5 4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
      </button>
      {isOpen &&
        createPortal(
          <div
            ref={listRef}
            id={`${id}-list`}
            role="listbox"
            tabIndex={-1}
            aria-label={label}
            aria-activedescendant={`${id}-option-${active}`}
            className="bricka-menu example-picker"
            data-placement={place?.placement ?? 'below'}
            style={{
              position: 'fixed',
              top: place?.top ?? -9999,
              left: place?.left ?? -9999,
              width: PICKER_WIDTH,
              transform:
                place?.placement === 'above' ? 'translateY(-100%)' : undefined,
              // Measured on the first frame before it's placed. Opacity, not
              // visibility, so it can still take focus.
              opacity: place ? undefined : 0,
            }}
            onKeyDown={onListKeyDown}
          >
            <div className="bricka-menu-list">
              <div className="bricka-menu-group-label" aria-hidden>
                {label}
              </div>
              {options.map((option, index) => (
                <div
                  key={option.value}
                  id={`${id}-option-${index}`}
                  role="option"
                  aria-selected={index === selected}
                  data-active={index === active || undefined}
                  className="bricka-option example-picker-option"
                  onPointerMove={() => setActive(index)}
                  onClick={() => pick(index)}
                >
                  <span className="example-picker-text">
                    <span className="bricka-option-label">{option.value}</span>
                    {option.description && (
                      <span className="example-picker-description">
                        {option.description}
                      </span>
                    )}
                  </span>
                  <svg
                    className="example-picker-check"
                    width="14"
                    height="14"
                    viewBox="0 0 16 16"
                    aria-hidden
                  >
                    <path
                      d="M3.5 8.5l3 3 6-7"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              ))}
            </div>
          </div>,
          document.body
        )}
    </>
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

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type RefObject,
} from 'react'
import { getText } from '../content'
import { getCaretIn, getCaretRect, isCaretAtEnd } from '../editor/caret'
import type {
  AutocompleteOptions,
  AutocompleteResult,
  AutocompleteSource,
  ComposerErrorSource,
  ComposerValue,
} from '../types'

export type GhostLayout = {
  top: number
  left: number
  height: number
  /** Present when the suggestion may wrap onto following lines. */
  wrap?: { width: number; indent: number }
}

export type GhostStatus = 'loading' | 'streaming' | 'ready'

export type GhostState = {
  suggestions: Array<string>
  index: number
  status: GhostStatus
  layout: GhostLayout
  typography: CSSProperties
}

type Params = {
  editorRef: RefObject<HTMLDivElement | null>
  wrapperRef: RefObject<HTMLDivElement | null>
  options: AutocompleteSource | AutocompleteOptions | undefined
  isSingleLine: boolean
  isBlocked: () => boolean
  insertText: (text: string) => void
  reportError: (error: unknown, source: ComposerErrorSource) => void
  onReady: (suggestion: string) => void
}

const DEFAULT_DELAY = 300
const DEFAULT_CONTEXT_LENGTH = 1000

function resolveOptions(
  options: AutocompleteSource | AutocompleteOptions
): Required<AutocompleteOptions> {
  const resolved =
    typeof options === 'function' ? { suggest: options } : options
  return {
    suggest: resolved.suggest,
    delay: resolved.delay ?? DEFAULT_DELAY,
    minLength: resolved.minLength ?? 1,
    contextLength: resolved.contextLength ?? DEFAULT_CONTEXT_LENGTH,
  }
}

function isAsyncIterable(value: unknown): value is AsyncIterable<string> {
  return (
    typeof value === 'object' && value !== null && Symbol.asyncIterator in value
  )
}

function toSuggestions(result: AutocompleteResult): Array<string> {
  const list = Array.isArray(result) ? result : [result]
  return list.filter(
    (item): item is string => typeof item === 'string' && item.length > 0
  )
}

function px(value: string): number {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : 0
}

/** Ghost-text autocomplete: debounced, cancellable, and never stale. */
export function useAutocomplete({
  editorRef,
  wrapperRef,
  options,
  isSingleLine,
  isBlocked,
  insertText,
  reportError,
  onReady,
}: Params) {
  const [ghost, setGhost] = useState<GhostState | null>(null)
  const ghostRef = useRef(ghost)
  ghostRef.current = ghost
  const timerRef = useRef<number | null>(null)
  const controllerRef = useRef<AbortController | null>(null)
  const requestIdRef = useRef(0)
  const latestRef = useRef({
    options,
    isBlocked,
    insertText,
    reportError,
    onReady,
  })
  latestRef.current = { options, isBlocked, insertText, reportError, onReady }

  function measure(): Pick<GhostState, 'layout' | 'typography'> | null {
    const editor = editorRef.current
    const wrapper = wrapperRef.current
    if (!editor || !wrapper) return null
    const range = getCaretIn(editor)
    if (!range) return null
    const rect = getCaretRect(range)
    if (!rect) return null

    const style = window.getComputedStyle(editor)
    const wrapperRect = wrapper.getBoundingClientRect()
    const lineHeight = px(style.lineHeight)
    const height = Math.max(rect.height, lineHeight)
    let top = rect.top - wrapperRect.top
    // Caret rects are glyph-sized; align with the line box instead.
    if (lineHeight > 0 && rect.height > 0 && rect.height < lineHeight) {
      top -= (lineHeight - rect.height) / 2
    }

    const layout: GhostLayout = {
      top,
      left: rect.left - wrapperRect.left,
      height,
    }
    if (!isSingleLine) {
      const editorRect = editor.getBoundingClientRect()
      const contentLeft =
        editorRect.left + px(style.borderLeftWidth) + px(style.paddingLeft)
      const innerWidth =
        editor.clientWidth > 0
          ? editor.clientWidth
          : editorRect.width -
            px(style.borderLeftWidth) -
            px(style.borderRightWidth)
      layout.left = contentLeft - wrapperRect.left
      layout.wrap = {
        width: Math.max(
          0,
          innerWidth - px(style.paddingLeft) - px(style.paddingRight)
        ),
        indent: Math.max(0, rect.left - contentLeft),
      }
    }

    const fontSize = px(style.fontSize)
    return {
      layout,
      typography: {
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        fontStyle: style.fontStyle,
        letterSpacing: style.letterSpacing,
        lineHeight:
          lineHeight > 0 && lineHeight < fontSize
            ? `${fontSize}px`
            : style.lineHeight,
      },
    }
  }

  function cancel(): void {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
    controllerRef.current?.abort()
    controllerRef.current = null
    requestIdRef.current += 1
    if (ghostRef.current !== null) {
      ghostRef.current = null
      setGhost(null)
    }
  }

  function isAtEnd(): boolean {
    const editor = editorRef.current
    const range = editor ? getCaretIn(editor) : null
    return Boolean(editor && range && isCaretAtEnd(editor, range))
  }

  function schedule(value: ComposerValue): void {
    cancel()
    const { options: raw, isBlocked: blocked } = latestRef.current
    if (!raw || blocked() || !isAtEnd()) return
    const config = resolveOptions(raw)
    const fullText = getText(value)
    if (fullText.trim().length < config.minLength) return

    timerRef.current = window.setTimeout(() => {
      timerRef.current = null
      void request(config, value, fullText)
    }, config.delay)
  }

  async function request(
    config: Required<AutocompleteOptions>,
    value: ComposerValue,
    fullText: string
  ): Promise<void> {
    const id = ++requestIdRef.current
    const controller = new AbortController()
    controllerRef.current = controller
    const isCurrent = () =>
      id === requestIdRef.current &&
      !controller.signal.aborted &&
      !latestRef.current.isBlocked() &&
      isAtEnd()

    const initial = measure()
    if (!initial) return
    const show = (next: GhostState | null) => {
      ghostRef.current = next
      setGhost(next)
    }
    show({ suggestions: [], index: 0, status: 'loading', ...initial })

    try {
      const result = await config.suggest({
        text: fullText.slice(-config.contextLength),
        value,
        signal: controller.signal,
      })
      if (!isCurrent()) return

      if (isAsyncIterable(result)) {
        let streamed = ''
        for await (const chunk of result) {
          if (!isCurrent()) return
          streamed += chunk
          if (streamed.length === 0) continue
          const layout = measure()
          if (!layout) return
          show({
            suggestions: [streamed],
            index: 0,
            status: 'streaming',
            ...layout,
          })
        }
        if (!isCurrent()) return
        if (streamed.length === 0) show(null)
        else {
          show({ ...ghostRef.current!, status: 'ready' })
          latestRef.current.onReady(streamed)
        }
        return
      }

      const suggestions = toSuggestions(result)
      const layout = measure()
      if (suggestions.length === 0 || !layout) {
        show(null)
        return
      }
      show({ suggestions, index: 0, status: 'ready', ...layout })
      latestRef.current.onReady(suggestions[0])
    } catch (error) {
      if (id !== requestIdRef.current || controller.signal.aborted) return
      show(null)
      latestRef.current.reportError(error, 'autocomplete')
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null
    }
  }

  function getVisible(): string {
    const current = ghostRef.current
    return current?.suggestions[current.index] ?? ''
  }

  function accept(): boolean {
    const suggestion = getVisible()
    if (suggestion.length === 0 || !isAtEnd()) return false
    cancel()
    latestRef.current.insertText(suggestion)
    return true
  }

  function cycle(): void {
    const current = ghostRef.current
    if (!current || current.suggestions.length < 2) return
    const next = {
      ...current,
      index: (current.index + 1) % current.suggestions.length,
    }
    ghostRef.current = next
    setGhost(next)
    latestRef.current.onReady(next.suggestions[next.index])
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): boolean {
    const current = ghostRef.current
    if (!current || getVisible().length === 0) return false

    if (event.key === 'Tab' && !event.shiftKey) {
      event.preventDefault()
      accept()
      return true
    }
    if (event.key === 'Tab' && current.suggestions.length > 1) {
      event.preventDefault()
      cycle()
      return true
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      cancel()
      return true
    }
    return false
  }

  const isVisible = ghost !== null
  useEffect(() => {
    if (!isVisible) return
    function sync(): void {
      const current = ghostRef.current
      const next = measure()
      if (!current) return
      if (!next) {
        cancel()
        return
      }
      const updated = { ...current, ...next }
      ghostRef.current = updated
      setGhost(updated)
    }
    window.addEventListener('resize', sync)
    return () => window.removeEventListener('resize', sync)
  })

  useEffect(() => () => cancel(), [])

  return {
    ghost,
    visibleSuggestion: getVisible(),
    schedule,
    cancel,
    accept,
    handleKeyDown,
  }
}

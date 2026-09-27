import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from 'react'
import { fuzzyFilter } from '../fuzzy'
import { findTrigger, getTriggerRect, type TriggerMatch } from '../editor/caret'
import {
  computeMenuPosition,
  getViewport,
  type MenuPlacement,
  type MenuPosition,
} from '../editor/position'
import type { ComposerErrorSource, ContextItem, Trigger } from '../types'

export type MenuStatus = 'idle' | 'loading' | 'ready' | 'error'

export type MenuState = {
  trigger: Trigger
  query: string
  items: Array<ContextItem>
  status: MenuStatus
  activeIndex: number
  position: MenuPosition | null
}

type Params = {
  editorRef: RefObject<HTMLDivElement | null>
  triggers: Array<Trigger>
  onChoose: (item: ContextItem, trigger: Trigger, match: TriggerMatch) => void
  onResults: (count: number) => void
  reportError: (error: unknown, source: ComposerErrorSource) => void
}

const DEFAULT_LIMIT = 50

/** Order items so each group is contiguous, in order of first appearance. */
function groupItems(items: Array<ContextItem>): Array<ContextItem> {
  if (!items.some((item) => item.group)) return items
  const groups = new Map<string, Array<ContextItem>>()
  for (const item of items) {
    const key = item.group ?? ''
    const list = groups.get(key)
    if (list) list.push(item)
    else groups.set(key, [item])
  }
  return Array.from(groups.values()).flat()
}

function shapeResults(
  trigger: Trigger,
  items: Array<ContextItem>,
  query: string
): Array<ContextItem> {
  let filtered = items
  if (trigger.filter) filtered = trigger.filter(items, query)
  else if (Array.isArray(trigger.items)) filtered = fuzzyFilter(items, query)
  return groupItems(filtered.slice(0, trigger.limit ?? DEFAULT_LIMIT))
}

function firstEnabled(items: Array<ContextItem>, from = 0, step = 1): number {
  const count = items.length
  for (let i = 0; i < count; i++) {
    const index = (((from + i * step) % count) + count) % count
    if (!items[index].disabled) return index
  }
  return -1
}

function isPromise<T>(value: unknown): value is Promise<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Promise<T>).then === 'function'
  )
}

function samePosition(a: MenuPosition | null, b: MenuPosition | null): boolean {
  if (!a || !b) return a === b
  return (
    a.placement === b.placement &&
    Math.abs(a.top - b.top) < 0.5 &&
    Math.abs(a.left - b.left) < 0.5 &&
    Math.abs(a.width - b.width) < 0.5 &&
    Math.abs(a.maxHeight - b.maxHeight) < 0.5
  )
}

/** Detects trigger characters, loads results, and owns menu navigation. */
export function useTriggerMenu({
  editorRef,
  triggers,
  onChoose,
  onResults,
  reportError,
}: Params) {
  const [menu, setMenuState] = useState<MenuState | null>(null)
  const menuRef = useRef(menu)
  const matchRef = useRef<TriggerMatch | null>(null)
  const dismissedRef = useRef<{ node: Text; offset: number } | null>(null)
  const placementRef = useRef<MenuPlacement | undefined>(undefined)
  const requestRef = useRef({
    id: 0,
    timer: null as number | null,
    controller: null as AbortController | null,
  })
  const menuElementRef = useRef<HTMLDivElement | null>(null)
  const latestRef = useRef({ triggers, onChoose, onResults, reportError })
  latestRef.current = { triggers, onChoose, onResults, reportError }

  function setMenu(
    next: MenuState | null | ((current: MenuState) => MenuState)
  ): void {
    const resolved =
      typeof next === 'function'
        ? menuRef.current && next(menuRef.current)
        : next
    menuRef.current = resolved
    setMenuState(resolved)
  }

  function cancelRequest(): void {
    const request = requestRef.current
    request.id += 1
    if (request.timer !== null) window.clearTimeout(request.timer)
    request.timer = null
    request.controller?.abort()
    request.controller = null
  }

  function measure(match: TriggerMatch): MenuPosition | null {
    const anchor = getTriggerRect(match)
    if (!anchor) return null
    const position = computeMenuPosition(
      anchor,
      getViewport(),
      placementRef.current
    )
    placementRef.current = position.placement
    return position
  }

  function close(): void {
    cancelRequest()
    matchRef.current = null
    placementRef.current = undefined
    if (menuRef.current) setMenu(null)
  }

  function dismiss(): void {
    const match = matchRef.current
    if (match) dismissedRef.current = { node: match.node, offset: match.offset }
    close()
  }

  function load(trigger: Trigger, query: string): void {
    cancelRequest()
    const request = requestRef.current
    const id = request.id
    const isCurrent = () => id === request.id && menuRef.current !== null

    const finish = (items: Array<ContextItem>) => {
      if (!isCurrent()) return
      const results = shapeResults(trigger, items, query)
      setMenu((current) => ({
        ...current,
        items: results,
        status: 'ready',
        activeIndex: firstEnabled(results),
      }))
      latestRef.current.onResults(results.length)
    }

    const fail = (error: unknown) => {
      if (!isCurrent() || request.controller?.signal.aborted) return
      setMenu((current) => ({
        ...current,
        items: [],
        status: 'error',
        activeIndex: -1,
      }))
      latestRef.current.reportError(error, 'trigger')
    }

    const source = trigger.items
    if (Array.isArray(source)) {
      finish(source)
      return
    }

    const run = () => {
      request.timer = null
      const controller = new AbortController()
      request.controller = controller
      try {
        const result = source({ query, signal: controller.signal })
        if (isPromise<Array<ContextItem>>(result)) {
          setMenu((current) => ({ ...current, status: 'loading' }))
          result.then(finish, fail)
        } else {
          finish(result)
        }
      } catch (error) {
        fail(error)
      }
    }

    const delay = trigger.debounce ?? 0
    if (delay > 0) {
      setMenu((current) => ({ ...current, status: 'loading' }))
      request.timer = window.setTimeout(run, delay)
    } else {
      run()
    }
  }

  /** Re-evaluate the text before the caret after an edit. */
  function update(): void {
    const editor = editorRef.current
    if (!editor) return
    const { triggers: current } = latestRef.current
    const chars = new Set(current.map((trigger) => trigger.char))
    const match = findTrigger(editor, chars)
    if (!match) {
      dismissedRef.current = null
      close()
      return
    }

    const dismissed = dismissedRef.current
    if (dismissed?.node === match.node && dismissed.offset === match.offset) {
      close()
      return
    }
    dismissedRef.current = null

    const trigger = current.find((item) => item.char === match.char)
    if (!trigger) return
    matchRef.current = match
    const open = menuRef.current

    if (!open || open.trigger.char !== trigger.char) {
      placementRef.current = undefined
      setMenu({
        trigger,
        query: match.query,
        items: [],
        status: 'idle',
        activeIndex: -1,
        position: measure(match),
      })
      load(trigger, match.query)
      return
    }

    const position = measure(match)
    if (open.query !== match.query || open.trigger !== trigger) {
      setMenu((state) => ({ ...state, trigger, query: match.query, position }))
      load(trigger, match.query)
    } else if (!samePosition(open.position, position)) {
      setMenu((state) => ({ ...state, position }))
    }
  }

  function select(index: number): void {
    const state = menuRef.current
    const match = matchRef.current
    const item = state?.items[index]
    if (!state || !match || !item || item.disabled) return
    close()
    latestRef.current.onChoose(item, state.trigger, match)
  }

  function setActive(index: number): void {
    const state = menuRef.current
    if (!state || state.activeIndex === index) return
    if (state.items[index]?.disabled) return
    setMenu((current) => ({ ...current, activeIndex: index }))
  }

  function move(step: 1 | -1): void {
    const state = menuRef.current
    if (!state || state.items.length === 0) return
    let from = state.activeIndex + step
    if (state.activeIndex === -1) from = step === 1 ? 0 : state.items.length - 1
    setActive(firstEnabled(state.items, from, step))
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): boolean {
    const state = menuRef.current
    if (!state) return false
    const isCtrlOnly =
      event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp':
        event.preventDefault()
        move(event.key === 'ArrowDown' ? 1 : -1)
        return true
      case 'n':
      case 'p':
        if (!isCtrlOnly) return false
        event.preventDefault()
        move(event.key === 'n' ? 1 : -1)
        return true
      case 'Enter':
      case 'Tab': {
        if (event.key === 'Tab' && event.shiftKey) {
          close()
          return false
        }
        if (state.activeIndex >= 0) {
          event.preventDefault()
          select(state.activeIndex)
          return true
        }
        if (state.status === 'loading' || state.status === 'idle') {
          event.preventDefault()
          return true
        }
        close()
        return false
      }
      case 'Escape':
        event.preventDefault()
        event.stopPropagation()
        dismiss()
        return true
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'Home':
      case 'End':
        close()
        return false
      default:
        return false
    }
  }

  const isOpen = menu !== null
  useEffect(() => {
    if (!isOpen) return
    let frame = 0

    function reposition(event?: Event): void {
      const target = event?.target
      if (target instanceof Node && menuElementRef.current?.contains(target)) {
        return
      }
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const match = matchRef.current
        if (!match || !menuRef.current) return
        const position = measure(match)
        if (!samePosition(menuRef.current.position, position)) {
          setMenu((state) => ({ ...state, position }))
        }
      })
    }

    function handlePointerDown(event: PointerEvent): void {
      const target = event.target
      if (!(target instanceof Node)) return
      if (editorRef.current?.contains(target)) return
      if (menuElementRef.current?.contains(target)) return
      close()
    }

    const visual = window.visualViewport
    document.addEventListener('pointerdown', handlePointerDown, true)
    window.addEventListener('resize', reposition)
    window.addEventListener('scroll', reposition, true)
    visual?.addEventListener('resize', reposition)
    visual?.addEventListener('scroll', reposition)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('pointerdown', handlePointerDown, true)
      window.removeEventListener('resize', reposition)
      window.removeEventListener('scroll', reposition, true)
      visual?.removeEventListener('resize', reposition)
      visual?.removeEventListener('scroll', reposition)
    }
    // Listeners only depend on refs; re-subscribing per render is wasteful.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  useEffect(() => () => cancelRequest(), [])

  return {
    menu,
    menuElementRef,
    isOpen: () => menuRef.current !== null,
    update,
    close,
    select,
    setActive,
    handleKeyDown,
  }
}

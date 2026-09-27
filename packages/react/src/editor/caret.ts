import {
  hasVisibleContent,
  isEditingArtifact,
  isTokenElement,
  SENTINEL,
  stripSentinels,
} from './dom'

export type Rect = {
  top: number
  left: number
  right: number
  bottom: number
  width: number
  height: number
}

export type TriggerMatch = {
  char: string
  query: string
  /** Text node and offset of the trigger character. */
  node: Text
  offset: number
}

const MAX_QUERY_LENGTH = 64

function finite(value: number): number {
  return Number.isFinite(value) ? value : 0
}

export function toRect(rect: DOMRect): Rect {
  return {
    top: finite(rect.top),
    left: finite(rect.left),
    right: finite(rect.right),
    bottom: finite(rect.bottom),
    width: finite(rect.width),
    height: finite(rect.height),
  }
}

/** The current selection range, if it lies inside `root`. */
export function getRangeIn(root: HTMLElement): Range | null {
  const selection = document.getSelection()
  if (!selection || selection.rangeCount === 0) return null
  const range = selection.getRangeAt(0)
  if (!root.contains(range.startContainer)) return null
  if (!root.contains(range.endContainer)) return null
  return range
}

export function getCaretIn(root: HTMLElement): Range | null {
  const range = getRangeIn(root)
  return range?.collapsed ? range : null
}

export function setCaret(node: Node, offset: number): void {
  const selection = document.getSelection()
  if (!selection) return
  const range = document.createRange()
  range.setStart(node, offset)
  range.collapse(true)
  selection.removeAllRanges()
  selection.addRange(range)
}

export function setCaretAtEnd(root: HTMLElement): void {
  const selection = document.getSelection()
  if (!selection) return
  const range = document.createRange()
  range.selectNodeContents(root)
  range.collapse(false)
  selection.removeAllRanges()
  selection.addRange(range)
}

/** True when nothing visible follows the caret. */
export function isCaretAtEnd(root: HTMLElement, range: Range): boolean {
  if (!range.collapsed || !root.contains(range.startContainer)) return false
  const trailing = range.cloneRange()
  try {
    trailing.setEnd(root, root.childNodes.length)
  } catch {
    return false
  }
  for (const child of trailing.cloneContents().childNodes) {
    if (hasVisibleContent(child)) return false
  }
  return true
}

function measure(range: Range): Rect | null {
  try {
    const rects = range.getClientRects()
    const rect =
      rects.length > 0 ? rects[rects.length - 1] : range.getBoundingClientRect()
    return toRect(rect)
  } catch {
    return null
  }
}

function caretAt(rect: Rect, x: number): Rect {
  return {
    top: rect.top,
    bottom: rect.bottom,
    height: rect.height,
    left: x,
    right: x,
    width: 0,
  }
}

/**
 * Caret rectangle. Collapsed ranges often report empty rects, so the
 * neighbouring character is measured instead. Text nodes are never split
 * and the selection is left untouched.
 */
export function getCaretRect(range: Range): Rect | null {
  const direct = measure(range)
  if (direct && (direct.width > 0 || direct.height > 0)) return direct

  const { startContainer: node, startOffset: offset } = range
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node as Text
    const probe = document.createRange()
    if (offset > 0) {
      probe.setStart(text, offset - 1)
      probe.setEnd(text, offset)
      const rect = measure(probe)
      return rect && caretAt(rect, rect.right)
    }
    if (text.length > 0) {
      probe.setStart(text, 0)
      probe.setEnd(text, 1)
      const rect = measure(probe)
      return rect && caretAt(rect, rect.left)
    }
    return direct
  }

  const selection = document.getSelection()
  const saved =
    selection && selection.rangeCount > 0
      ? selection.getRangeAt(0).cloneRange()
      : null
  const marker = document.createElement('span')
  marker.textContent = SENTINEL
  node.insertBefore(marker, node.childNodes[offset] ?? null)
  const rect = toRect(marker.getBoundingClientRect())
  marker.remove()
  if (selection && saved) {
    selection.removeAllRanges()
    selection.addRange(saved)
  }
  return rect
}

/** Rect of the trigger character. */
export function getTriggerRect(match: TriggerMatch): Rect | null {
  const range = document.createRange()
  try {
    range.setStart(match.node, match.offset)
    range.setEnd(match.node, match.offset + 1)
  } catch {
    return null
  }
  return measure(range)
}

function isWordBoundary(char: string | undefined): boolean {
  return char === undefined || char === SENTINEL || /\s/.test(char)
}

/** Last character of the text run before `node`, or undefined at a boundary. */
function charBefore(node: Text, offset: number): string | undefined {
  if (offset > 0) return node.data[offset - 1]
  const previous = node.previousSibling
  if (previous?.nodeType !== Node.TEXT_NODE) return undefined
  const data = (previous as Text).data
  return data[data.length - 1]
}

/**
 * Find a trigger character before the caret: it must start a word and be
 * followed by a query without whitespace.
 */
export function findTrigger(
  root: HTMLElement,
  chars: ReadonlySet<string>
): TriggerMatch | null {
  if (chars.size === 0) return null
  const range = getCaretIn(root)
  if (!range) return null

  let node: Node | null = range.startContainer
  let offset = range.startOffset
  if (node.nodeType === Node.ELEMENT_NODE) {
    const before: ChildNode | undefined = node.childNodes[offset - 1]
    if (before?.nodeType !== Node.TEXT_NODE) return null
    node = before
    offset = (before as Text).data.length
  }

  let query = ''
  while (node?.nodeType === Node.TEXT_NODE) {
    const text = node as Text
    for (let i = offset - 1; i >= 0; i--) {
      const char = text.data[i]
      if (isWordBoundary(char)) return null
      if (chars.has(char) && isWordBoundary(charBefore(text, i))) {
        return { char, query, node: text, offset: i }
      }
      query = char + query
      if (query.length > MAX_QUERY_LENGTH) return null
    }
    node = text.previousSibling
    offset = node?.nodeType === Node.TEXT_NODE ? (node as Text).data.length : 0
  }
  return null
}

function previousInRoot(node: Node, root: HTMLElement): Node | null {
  if (node === root) return null
  if (node.previousSibling) return deepestLast(node.previousSibling)
  const parent = node.parentNode
  if (!parent || !root.contains(parent)) return null
  return parent
}

function nextInRoot(node: Node, root: HTMLElement): Node | null {
  if (node === root) return null
  if (node.nextSibling) return deepestFirst(node.nextSibling)
  const parent = node.parentNode
  if (!parent || parent === root || !root.contains(parent)) return null
  return parent.nextSibling ? deepestFirst(parent.nextSibling) : null
}

function isAtomic(node: Node): boolean {
  return (
    isTokenElement(node) ||
    (node.nodeType === Node.ELEMENT_NODE &&
      (node as HTMLElement).contentEditable === 'false')
  )
}

function deepestLast(node: Node): Node {
  let current = node
  while (current.lastChild && !isAtomic(current)) current = current.lastChild
  return current
}

function deepestFirst(node: Node): Node {
  let current = node
  while (current.firstChild && !isAtomic(current)) current = current.firstChild
  return current
}

/** Token directly before a collapsed caret, skipping editing artifacts. */
export function getTokenBeforeCaret(root: HTMLElement): HTMLElement | null {
  const range = getCaretIn(root)
  if (!range) return null
  const { startContainer, startOffset } = range

  let node: Node | null
  if (startContainer.nodeType === Node.TEXT_NODE) {
    const left = stripSentinels(
      (startContainer.textContent ?? '').slice(0, startOffset)
    )
    if (left.trim().length > 0) return null
    node =
      startOffset > 0 ? startContainer : previousInRoot(startContainer, root)
  } else if (startOffset > 0) {
    node = deepestLast(startContainer.childNodes[startOffset - 1])
  } else {
    node = previousInRoot(startContainer, root)
  }

  while (node && node !== root) {
    if (isTokenElement(node)) return node as HTMLElement
    if (!isEditingArtifact(node)) return null
    node = previousInRoot(node, root)
  }
  return null
}

/** Token directly after a collapsed caret. Only sentinels may sit between. */
export function getTokenAfterCaret(root: HTMLElement): HTMLElement | null {
  const range = getCaretIn(root)
  if (!range) return null
  const { startContainer, startOffset } = range

  let node: Node | null
  if (startContainer.nodeType === Node.TEXT_NODE) {
    const right = stripSentinels(
      (startContainer.textContent ?? '').slice(startOffset)
    )
    if (right.length > 0) return null
    node = nextInRoot(startContainer, root)
  } else {
    const child: ChildNode | undefined = startContainer.childNodes[startOffset]
    node = child ? deepestFirst(child) : nextInRoot(startContainer, root)
  }

  while (node && node !== root) {
    if (isTokenElement(node)) return node as HTMLElement
    if (node.nodeType !== Node.TEXT_NODE) return null
    if (stripSentinels(node.textContent ?? '').length > 0) return null
    node = nextInRoot(node, root)
  }
  return null
}

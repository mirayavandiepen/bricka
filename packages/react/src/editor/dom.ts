import type { ComposerValue, ContextItem, Segment } from '../types'

/** Attribute that marks a token host span and holds its registry key. */
export const TOKEN_ATTR = 'data-inlay-token'
/** Zero-width text kept after every token so the caret has a landing spot. */
export const SENTINEL = '\u200B'

export type TokenEntry = {
  trigger?: string
  item: ContextItem
}

/**
 * Maps token host elements to their items. Keys are per instance, so the
 * same item can appear several times.
 */
export class TokenRegistry {
  private entries = new Map<string, TokenEntry>()
  private nextKey = 0

  add(entry: TokenEntry): string {
    const key = String(++this.nextKey)
    this.entries.set(key, entry)
    return key
  }

  get(key: string): TokenEntry | undefined {
    return this.entries.get(key)
  }

  clear(): void {
    this.entries.clear()
  }
}

export function stripSentinels(text: string): string {
  return text.split(SENTINEL).join('')
}

export function isTokenElement(node: Node | null): boolean {
  return (
    node !== null &&
    node.nodeType === Node.ELEMENT_NODE &&
    (node as HTMLElement).hasAttribute(TOKEN_ATTR)
  )
}

export function createTokenElement(
  registry: TokenRegistry,
  entry: TokenEntry
): HTMLSpanElement {
  const span = document.createElement('span')
  span.setAttribute(TOKEN_ATTR, registry.add(entry))
  span.contentEditable = 'false'
  span.className = 'inlay-token-host'
  if (entry.trigger) span.dataset.trigger = entry.trigger
  if (entry.item.type) span.dataset.type = entry.item.type
  return span
}

/** Read editor DOM into segments. Handles browser `<div>`/`<br>` shapes. */
export function readDom(
  root: HTMLElement,
  registry: TokenRegistry
): ComposerValue {
  const segments: Array<Segment> = []
  let pending = ''

  function flush(): void {
    if (pending.length === 0) return
    segments.push({ type: 'text', text: pending })
    pending = ''
  }

  function walk(parent: Node, isBlockChild: boolean): void {
    for (const node of parent.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        pending += stripSentinels(node.textContent ?? '')
        continue
      }
      if (node.nodeType !== Node.ELEMENT_NODE) continue

      const element = node as HTMLElement
      if (element.tagName === 'BR') {
        // A trailing <br> inside a block is only a caret placeholder.
        if (!(isBlockChild && !element.nextSibling)) pending += '\n'
        continue
      }

      const key = element.getAttribute(TOKEN_ATTR)
      if (key !== null) {
        const entry = registry.get(key)
        if (!entry) continue
        flush()
        segments.push(
          entry.trigger === undefined
            ? { type: 'token', item: entry.item }
            : { type: 'token', trigger: entry.trigger, item: entry.item }
        )
        continue
      }

      // Block wrapper created by the browser on Enter.
      if (pending.length > 0 || segments.length > 0) pending += '\n'
      walk(element, true)
    }
  }

  walk(root, false)
  flush()
  return segments
}

/** Build DOM for segments. Every token is followed by a sentinel. */
export function writeDom(
  value: ComposerValue,
  registry: TokenRegistry
): DocumentFragment {
  const fragment = document.createDocumentFragment()
  for (const segment of value) {
    if (segment.type === 'text') {
      appendText(fragment, segment.text)
      continue
    }
    fragment.appendChild(
      createTokenElement(registry, {
        trigger: segment.trigger,
        item: segment.item,
      })
    )
    fragment.appendChild(document.createTextNode(SENTINEL))
  }
  return fragment
}

function appendText(parent: Node, text: string): void {
  text.split('\n').forEach((line, index) => {
    if (index > 0) parent.appendChild(document.createElement('br'))
    if (line.length > 0) parent.appendChild(document.createTextNode(line))
  })
}

/** Whitespace, sentinels, `<br>` and empty wrappers left behind by editing. */
export function isEditingArtifact(node: Node): boolean {
  if (node.nodeType === Node.TEXT_NODE) {
    return stripSentinels(node.textContent ?? '').trim().length === 0
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return false
  const element = node as HTMLElement
  if (element.tagName === 'BR') return true
  if (isTokenElement(element)) return false
  for (const child of element.childNodes) {
    if (child.nodeType === Node.COMMENT_NODE) continue
    if (!isEditingArtifact(child)) return false
  }
  return true
}

export function hasVisibleContent(node: Node): boolean {
  if (node.nodeType === Node.TEXT_NODE) {
    return stripSentinels(node.textContent ?? '').length > 0
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return false
  const element = node as HTMLElement
  if (isTokenElement(element) || element.tagName === 'BR') return true
  for (const child of element.childNodes) {
    if (hasVisibleContent(child)) return true
  }
  return false
}

/** Avoid a double space where a token used to sit between two spaces. */
export function collapseDoubleSpace(marker: Node): void {
  const previous = marker.previousSibling
  const next = marker.nextSibling
  if (previous?.nodeType !== Node.TEXT_NODE) return
  if (next?.nodeType !== Node.TEXT_NODE) return
  const nextText = next.textContent ?? ''
  if (!(previous.textContent ?? '').endsWith(' ')) return
  if (!nextText.startsWith(' ')) return
  if (nextText.length > 1) next.textContent = nextText.slice(1)
  else next.parentNode?.removeChild(next)
}

export function trimTrailingNewlines(value: ComposerValue): ComposerValue {
  const last = value[value.length - 1]
  if (last?.type !== 'text') return value
  const trimmed = last.text.replace(/\n+$/, '')
  if (trimmed === last.text) return value
  if (trimmed === '') return value.slice(0, -1)
  return [...value.slice(0, -1), { type: 'text', text: trimmed }]
}

/** Normalize clipboard text: unify line breaks, drop trailing breaks. */
export function normalizePastedText(
  text: string,
  isSingleLine: boolean
): string {
  const unified = text
    .replace(/\r\n?/g, '\n')
    .replace(/\u00A0/g, ' ')
    .replace(/[\u200B\uFEFF]/g, '')
    .replace(/\n+$/, '')
  return isSingleLine ? unified.replace(/\s*\n\s*/g, ' ') : unified
}

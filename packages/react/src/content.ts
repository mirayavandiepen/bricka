import type { ComposerValue, ContextItem, Segment, TokenSegment } from './types'

export type SerializedItem = Omit<ContextItem, 'icon'>

export type SerializedSegment =
  | { type: 'text'; text: string }
  | { type: 'token'; trigger?: string; item: SerializedItem }

export type GetTextOptions = {
  formatToken?: (token: TokenSegment) => string
}

/** The plain-text form of a single token. */
export function getTokenText(token: TokenSegment): string {
  return token.item.text ?? `${token.trigger ?? ''}${token.item.label}`
}

/** Convert composer content to plain text, e.g. for a model prompt. */
export function getText(
  value: ComposerValue,
  options: GetTextOptions = {}
): string {
  const formatToken = options.formatToken ?? getTokenText
  let text = ''
  for (const segment of value) {
    text += segment.type === 'text' ? segment.text : formatToken(segment)
  }
  return text
}

/** Items referenced by tokens, optionally limited to one trigger. */
export function getTokens(
  value: ComposerValue,
  trigger?: string
): Array<ContextItem> {
  const items: Array<ContextItem> = []
  for (const segment of value) {
    if (segment.type !== 'token') continue
    if (trigger !== undefined && segment.trigger !== trigger) continue
    items.push(segment.item)
  }
  return items
}

/** JSON-safe content: React nodes such as icons are dropped. */
export function serialize(value: ComposerValue): Array<SerializedSegment> {
  return value.map((segment) => {
    if (segment.type === 'text') return { type: 'text', text: segment.text }
    const { icon: _icon, ...item } = segment.item
    return segment.trigger === undefined
      ? { type: 'token', item }
      : { type: 'token', trigger: segment.trigger, item }
  })
}

/** True when there is no token and no non-whitespace text. */
export function isEmpty(value: ComposerValue): boolean {
  return value.every(
    (segment) => segment.type === 'text' && segment.text.trim() === ''
  )
}

export function isSameToken(a: TokenSegment, b: TokenSegment): boolean {
  return a.trigger === b.trigger && a.item.id === b.item.id
}

/** Structural equality. Tokens compare by trigger and id. */
export function isEqual(a: ComposerValue, b: ComposerValue): boolean {
  if (a === b) return true
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    const left = a[i]
    const right = b[i]
    if (left.type === 'text') {
      if (right.type !== 'text' || left.text !== right.text) return false
    } else if (right.type !== 'token' || !isSameToken(left, right)) {
      return false
    }
  }
  return true
}

/** Merge adjacent text, drop empty text, collapse newline-only content. */
export function normalizeValue(value: ComposerValue): ComposerValue {
  const result: Array<Segment> = []
  for (const segment of value) {
    if (segment.type === 'token') {
      result.push(segment)
      continue
    }
    if (segment.text.length === 0) continue
    const previous = result[result.length - 1]
    if (previous?.type === 'text') {
      result[result.length - 1] = {
        type: 'text',
        text: previous.text + segment.text,
      }
    } else {
      result.push(segment)
    }
  }
  if (
    result.length === 1 &&
    result[0].type === 'text' &&
    /^[\r\n]+$/.test(result[0].text)
  ) {
    return []
  }
  return result
}

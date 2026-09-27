// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  findTrigger,
  getTokenAfterCaret,
  getTokenBeforeCaret,
  isCaretAtEnd,
} from '../src/editor/caret'
import { createTokenElement, SENTINEL, TokenRegistry } from '../src/editor/dom'
import { setCaret } from './helpers/render'

let root: HTMLDivElement
const chars = new Set(['@', '/'])

beforeEach(() => {
  root = document.createElement('div')
  document.body.appendChild(root)
})

afterEach(() => root.remove())

function textAt(text: string, offset = text.length): Text {
  const node = document.createTextNode(text)
  root.appendChild(node)
  setCaret(node, offset)
  return node
}

describe('findTrigger', () => {
  it('matches a trigger at the start of input', () => {
    textAt('@comp')
    expect(findTrigger(root, chars)).toMatchObject({
      char: '@',
      query: 'comp',
      offset: 0,
    })
  })

  it('matches after whitespace and returns an empty query', () => {
    textAt('hello @')
    expect(findTrigger(root, chars)).toMatchObject({ char: '@', query: '' })
  })

  it('ignores triggers inside words, such as emails and URLs', () => {
    textAt('mail me@example')
    expect(findTrigger(root, chars)).toBeNull()
    root.textContent = ''
    textAt('https://x')
    expect(findTrigger(root, chars)).toBeNull()
  })

  it('allows trigger characters inside the query', () => {
    textAt('open @src/app.tsx')
    expect(findTrigger(root, chars)).toMatchObject({
      char: '@',
      query: 'src/app.tsx',
    })
  })

  it('stops at whitespace', () => {
    textAt('@foo bar')
    expect(findTrigger(root, chars)).toBeNull()
  })

  it('treats the sentinel after a token as a word boundary', () => {
    root.appendChild(
      createTokenElement(new TokenRegistry(), { item: { id: 'a', label: 'a' } })
    )
    textAt(`${SENTINEL}/fix`)
    expect(findTrigger(root, chars)).toMatchObject({ char: '/', query: 'fix' })
  })

  it('spans text nodes split by the browser', () => {
    root.appendChild(document.createTextNode('say @co'))
    textAt('mp')
    expect(findTrigger(root, chars)).toMatchObject({ query: 'comp' })
  })

  it('uses the caret position, not the end of the text', () => {
    textAt('@abc tail', 4)
    expect(findTrigger(root, chars)).toMatchObject({ query: 'abc' })
  })
})

describe('token around caret', () => {
  let registry: TokenRegistry
  beforeEach(() => {
    registry = new TokenRegistry()
  })

  it('finds a token right before the caret, skipping its sentinel', () => {
    const host = createTokenElement(registry, { item: { id: 'a', label: 'a' } })
    root.append('x ', host)
    textAt(SENTINEL)
    expect(getTokenBeforeCaret(root)).toBe(host)
  })

  it('skips whitespace spacers and <br> placeholders', () => {
    const host = createTokenElement(registry, { item: { id: 'a', label: 'a' } })
    root.append(
      host,
      document.createTextNode(`${SENTINEL} `),
      document.createElement('br')
    )
    setCaret(root, root.childNodes.length)
    expect(getTokenBeforeCaret(root)).toBe(host)
  })

  it('returns null when text sits between caret and token', () => {
    const host = createTokenElement(registry, { item: { id: 'a', label: 'a' } })
    root.append(host)
    textAt(`${SENTINEL} hi`)
    expect(getTokenBeforeCaret(root)).toBeNull()
  })

  it('finds a token right after the caret', () => {
    const before = textAt('see ')
    const host = createTokenElement(registry, { item: { id: 'a', label: 'a' } })
    root.append(host, SENTINEL)
    setCaret(before, 4)
    expect(getTokenAfterCaret(root)).toBe(host)
    setCaret(before, 2)
    expect(getTokenAfterCaret(root)).toBeNull()
  })

  it('does not walk outside the root', () => {
    const outside = createTokenElement(registry, {
      item: { id: 'a', label: 'a' },
    })
    document.body.insertBefore(outside, root)
    textAt('')
    expect(getTokenBeforeCaret(root)).toBeNull()
    outside.remove()
  })
})

describe('isCaretAtEnd', () => {
  it('ignores trailing sentinels', () => {
    const node = textAt(`abc${SENTINEL}`, 3)
    const range = document.getSelection()!.getRangeAt(0)
    expect(isCaretAtEnd(root, range)).toBe(true)
    setCaret(node, 1)
    expect(isCaretAtEnd(root, document.getSelection()!.getRangeAt(0))).toBe(
      false
    )
  })
})

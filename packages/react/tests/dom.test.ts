// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest'
import {
  createTokenElement,
  normalizePastedText,
  readDom,
  SENTINEL,
  TOKEN_ATTR,
  TokenRegistry,
  trimTrailingNewlines,
  writeDom,
} from '../src/editor/dom'
import type { ComposerValue } from '../src/types'

let registry: TokenRegistry
let root: HTMLDivElement

beforeEach(() => {
  registry = new TokenRegistry()
  root = document.createElement('div')
})

const file = { id: 'f', label: 'Composer.tsx' }

describe('writeDom / readDom', () => {
  it('round-trips text, tokens and newlines', () => {
    const value: ComposerValue = [
      { type: 'text', text: 'Fix ' },
      { type: 'token', trigger: '@', item: file },
      { type: 'text', text: ' now\nplease' },
      { type: 'token', item: { id: 'x', label: 'x' } },
    ]
    root.appendChild(writeDom(value, registry))
    expect(readDom(root, registry)).toEqual(value)
  })

  it('round-trips adjacent tokens', () => {
    const value: ComposerValue = [
      { type: 'token', trigger: '@', item: file },
      { type: 'token', trigger: '@', item: file },
    ]
    root.appendChild(writeDom(value, registry))
    expect(root.querySelectorAll(`[${TOKEN_ATTR}]`)).toHaveLength(2)
    expect(readDom(root, registry)).toEqual(value)
  })

  it('places a sentinel after every token', () => {
    root.appendChild(writeDom([{ type: 'token', item: file }], registry))
    expect(root.lastChild?.textContent).toBe(SENTINEL)
  })

  it('marks token hosts as atomic with trigger and type data', () => {
    const host = createTokenElement(registry, {
      trigger: '/',
      item: { id: 'c', label: 'fix', type: 'command' },
    })
    expect(host.contentEditable).toBe('false')
    expect(host.dataset.trigger).toBe('/')
    expect(host.dataset.type).toBe('command')
  })
})

describe('readDom with browser shapes', () => {
  it('strips sentinels inside text', () => {
    root.innerHTML = `a${SENTINEL}b`
    expect(readDom(root, registry)).toEqual([{ type: 'text', text: 'ab' }])
  })

  it('reads <br> as a newline', () => {
    root.innerHTML = 'a<br>b'
    expect(readDom(root, registry)).toEqual([{ type: 'text', text: 'a\nb' }])
  })

  it('reads div-wrapped lines from Enter', () => {
    root.innerHTML = 'one<div>two</div><div><br></div><div>four</div>'
    expect(readDom(root, registry)).toEqual([
      { type: 'text', text: 'one\ntwo\n\nfour' },
    ])
  })

  it('skips token hosts missing from the registry', () => {
    root.innerHTML = `a<span ${TOKEN_ATTR}="99"></span>b`
    expect(readDom(root, registry)).toEqual([{ type: 'text', text: 'ab' }])
  })

  it('reads tokens inside wrappers', () => {
    const host = createTokenElement(registry, { item: file })
    const line = document.createElement('div')
    line.append('see ', host)
    root.append('first', line)
    expect(readDom(root, registry)).toEqual([
      { type: 'text', text: 'first\nsee ' },
      { type: 'token', item: file },
    ])
  })
})

describe('normalizePastedText', () => {
  it('unifies line endings and trims trailing breaks', () => {
    expect(normalizePastedText('a\r\nb\r\n\r\n', false)).toBe('a\nb')
  })

  it('joins lines with spaces in single-line mode', () => {
    expect(normalizePastedText('a\n  b\nc\n', true)).toBe('a b c')
  })

  it('removes zero-width characters and non-breaking spaces', () => {
    expect(normalizePastedText(`a\u00A0b${SENTINEL}c`, false)).toBe('a bc')
  })
})

describe('trimTrailingNewlines', () => {
  it('drops trailing newlines from the last text run', () => {
    expect(trimTrailingNewlines([{ type: 'text', text: 'a\n\n' }])).toEqual([
      { type: 'text', text: 'a' },
    ])
    expect(
      trimTrailingNewlines([
        { type: 'token', item: file },
        { type: 'text', text: '\n' },
      ])
    ).toEqual([{ type: 'token', item: file }])
  })
})

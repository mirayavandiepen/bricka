import { describe, expect, it } from 'vitest'
import {
  getText,
  getTokens,
  isEmpty,
  isEqual,
  normalizeValue,
  serialize,
} from '../src/content'
import type { ComposerValue } from '../src/types'

const file = { id: 'f1', label: 'Composer.tsx', type: 'file', icon: 'x' }
const value: ComposerValue = [
  { type: 'text', text: 'Fix ' },
  { type: 'token', trigger: '@', item: file },
  { type: 'text', text: ' and check ' },
  { type: 'token', trigger: '/', item: { id: 'a11y', label: 'accessibility' } },
]

describe('getText', () => {
  it('writes tokens as trigger + label', () => {
    expect(getText(value)).toBe('Fix @Composer.tsx and check /accessibility')
  })

  it('prefers item.text and supports a custom formatter', () => {
    const url: ComposerValue = [
      {
        type: 'token',
        item: { id: 'u', label: 'github.com', text: 'https://github.com' },
      },
    ]
    expect(getText(url)).toBe('https://github.com')
    expect(getText(value, { formatToken: (t) => `[${t.item.id}]` })).toBe(
      'Fix [f1] and check [a11y]'
    )
  })

  it('returns an empty string for empty content', () => {
    expect(getText([])).toBe('')
  })
})

describe('getTokens', () => {
  it('lists items, optionally for one trigger', () => {
    expect(getTokens(value).map((i) => i.id)).toEqual(['f1', 'a11y'])
    expect(getTokens(value, '/').map((i) => i.id)).toEqual(['a11y'])
  })
})

describe('serialize', () => {
  it('drops icons and keeps JSON-safe data', () => {
    const json = serialize(value)
    expect(json[1]).toEqual({
      type: 'token',
      trigger: '@',
      item: { id: 'f1', label: 'Composer.tsx', type: 'file' },
    })
    expect(JSON.parse(JSON.stringify(json))).toEqual(json)
  })
})

describe('isEmpty', () => {
  it('treats whitespace-only text as empty', () => {
    expect(isEmpty([])).toBe(true)
    expect(isEmpty([{ type: 'text', text: ' \n ' }])).toBe(true)
    expect(isEmpty([{ type: 'text', text: 'hi' }])).toBe(false)
  })

  it('is not empty when a token is present', () => {
    expect(isEmpty([{ type: 'token', item: file }])).toBe(false)
  })
})

describe('isEqual', () => {
  it('compares tokens by trigger and id', () => {
    const relabeled: ComposerValue = value.map((s) =>
      s.type === 'token' ? { ...s, item: { ...s.item, label: 'other' } } : s
    )
    expect(isEqual(value, relabeled)).toBe(true)
    expect(
      isEqual(
        [{ type: 'token', trigger: '@', item: file }],
        [{ type: 'token', trigger: '#', item: file }]
      )
    ).toBe(false)
  })

  it('detects text and length differences', () => {
    expect(
      isEqual([{ type: 'text', text: 'a' }], [{ type: 'text', text: 'b' }])
    ).toBe(false)
    expect(isEqual(value, value.slice(1))).toBe(false)
  })
})

describe('normalizeValue', () => {
  it('merges adjacent text and drops empty runs', () => {
    expect(
      normalizeValue([
        { type: 'text', text: 'a' },
        { type: 'text', text: '' },
        { type: 'text', text: 'b' },
      ])
    ).toEqual([{ type: 'text', text: 'ab' }])
  })

  it('collapses newline-only content but keeps spaces', () => {
    expect(normalizeValue([{ type: 'text', text: '\n' }])).toEqual([])
    expect(normalizeValue([{ type: 'text', text: ' ' }])).toEqual([
      { type: 'text', text: ' ' },
    ])
  })
})

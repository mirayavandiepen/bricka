import { act, cleanup, fireEvent } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ComposerValue } from '../src'
import { SENTINEL } from '../src/editor/dom'
import {
  caretToEnd,
  item,
  press,
  renderComposer,
  setCaret,
  tokenHosts,
  type,
  visibleText,
} from './helpers/render'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const file = item('c', 'Composer.tsx', {
  type: 'file',
  description: 'src/components/Composer.tsx',
})

function setup(value: ComposerValue) {
  const onValueChange = vi.fn()
  const utils = renderComposer({
    composer: { defaultValue: value, onValueChange },
  })
  act(() => {
    utils.editor.focus()
    caretToEnd(utils.editor)
  })
  return { ...utils, onValueChange }
}

const sentence: ComposerValue = [
  { type: 'text', text: 'Fix ' },
  { type: 'token', trigger: '@', item: file },
]

describe('rendering', () => {
  it('renders label, type and trigger data', () => {
    const { editor } = setup(sentence)
    const token = editor.querySelector('.bricka-token')!
    expect(token.querySelector('.bricka-token-label')?.textContent).toBe(
      'Composer.tsx'
    )
    expect(token.getAttribute('data-type')).toBe('file')
    expect(token.getAttribute('data-trigger')).toBe('@')
  })

  it('renders item icons in the token', () => {
    const { editor } = setup([
      {
        type: 'token',
        trigger: '@',
        item: { ...file, icon: <svg data-testid="icon" /> },
      },
    ])
    expect(editor.querySelector('[data-testid="icon"]')).not.toBeNull()
  })

  it('shows a tooltip with the description after hovering', () => {
    vi.useFakeTimers()
    const { editor } = setup(sentence)
    fireEvent.mouseEnter(editor.querySelector('.bricka-token')!)
    expect(document.querySelector('[role="tooltip"]')).toBeNull()
    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(document.querySelector('[role="tooltip"]')?.textContent).toBe(
      'src/components/Composer.tsx'
    )
  })
})

describe('Backspace', () => {
  it('selects the token first, then deletes it', () => {
    const { editor, onValueChange } = setup(sentence)
    press(editor, 'Backspace')
    const host = tokenHosts(editor)[0]
    expect(host.hasAttribute('data-selected')).toBe(true)
    expect(
      editor.querySelector('.bricka-token')?.hasAttribute('data-selected')
    ).toBe(true)
    expect(editor.style.caretColor).toBe('transparent')
    expect(onValueChange).not.toHaveBeenCalled()

    press(editor, 'Backspace')
    expect(tokenHosts(editor)).toHaveLength(0)
    expect(editor.style.caretColor).toBe('')
    expect(onValueChange).toHaveBeenLastCalledWith([
      { type: 'text', text: 'Fix ' },
    ])
  })

  it('selects through a trailing space and line breaks', () => {
    const { editor } = setup([
      { type: 'token', trigger: '@', item: file },
      { type: 'text', text: ' ' },
    ])
    press(editor, 'Backspace')
    expect(tokenHosts(editor)[0].hasAttribute('data-selected')).toBe(true)
  })

  it('deletes normally when text sits before the caret', () => {
    const { editor } = setup([...sentence, { type: 'text', text: ' ok' }])
    press(editor, 'Backspace')
    expect(tokenHosts(editor)[0].hasAttribute('data-selected')).toBe(false)
  })

  it('does not leave double spaces or trailing newlines', () => {
    const { editor, onValueChange } = setup([
      { type: 'text', text: 'a ' },
      { type: 'token', trigger: '@', item: file },
      { type: 'text', text: ' b' },
    ])
    const tail = Array.from(editor.childNodes).find((n) =>
      n.textContent?.includes('b')
    )!
    setCaret(tail, tail.textContent!.indexOf(' '))
    press(editor, 'Backspace')
    press(editor, 'Backspace')
    expect(onValueChange).toHaveBeenLastCalledWith([
      { type: 'text', text: 'a b' },
    ])
  })
})

describe('Delete and arrows', () => {
  it('selects the token after the caret with Delete', () => {
    const { editor, onValueChange } = setup([
      { type: 'text', text: 'see ' },
      { type: 'token', trigger: '@', item: file },
    ])
    setCaret(editor.firstChild!, 4)
    press(editor, 'Delete')
    expect(tokenHosts(editor)[0].hasAttribute('data-selected')).toBe(true)
    press(editor, 'Delete')
    expect(onValueChange).toHaveBeenLastCalledWith([
      { type: 'text', text: 'see ' },
    ])
  })

  it('moves the caret around a selected token and deselects', () => {
    const { editor } = setup(sentence)
    press(editor, 'Backspace')
    press(editor, 'ArrowLeft')
    expect(tokenHosts(editor)[0].hasAttribute('data-selected')).toBe(false)
    const range = document.getSelection()!.getRangeAt(0)
    const host = tokenHosts(editor)[0]
    expect(range.startContainer).toBe(host.parentNode)
    expect(range.startContainer.childNodes[range.startOffset]).toBe(host)

    press(editor, 'Backspace')
    expect(tokenHosts(editor)[0].hasAttribute('data-selected')).toBe(false)
  })

  it('deselects on Escape and when typing', () => {
    const { editor } = setup(sentence)
    press(editor, 'Backspace')
    press(editor, 'Escape')
    expect(tokenHosts(editor)[0].hasAttribute('data-selected')).toBe(false)
    press(editor, 'Backspace')
    press(editor, 'x')
    expect(tokenHosts(editor)[0].hasAttribute('data-selected')).toBe(false)
  })
})

describe('pointer', () => {
  it('selects on click and removes with the hover button', () => {
    const { editor, onValueChange } = setup(sentence)
    const token = editor.querySelector('.bricka-token')!
    fireEvent.mouseDown(token)
    expect(tokenHosts(editor)[0].hasAttribute('data-selected')).toBe(true)
    fireEvent.mouseEnter(token)
    fireEvent.mouseDown(editor.querySelector('.bricka-token-remove')!)
    expect(tokenHosts(editor)).toHaveLength(0)
    expect(onValueChange).toHaveBeenLastCalledWith([
      { type: 'text', text: 'Fix ' },
    ])
  })
})

describe('clipboard', () => {
  it('copies clean text and structured content', () => {
    const { editor } = setup([...sentence, { type: 'text', text: ' now' }])
    const range = document.createRange()
    range.selectNodeContents(editor)
    document.getSelection()!.removeAllRanges()
    document.getSelection()!.addRange(range)

    const data = new Map<string, string>()
    const clipboardData = { setData: (k: string, v: string) => data.set(k, v) }
    fireEvent.copy(editor, { clipboardData })
    expect(data.get('text/plain')).toBe('Fix @Composer.tsx now')
    expect(data.get('text/plain')).not.toContain(SENTINEL)
    const json = JSON.parse(
      data.get('application/x-bricka+json')!
    ) as Array<unknown>
    expect(json[1]).toMatchObject({
      type: 'token',
      trigger: '@',
      item: { id: 'c' },
    })
  })

  it('pastes structured content back as tokens', () => {
    const onValueChange = vi.fn()
    const { editor } = renderComposer({ composer: { onValueChange } })
    act(() => editor.focus())
    type(editor, 'Hi ')
    const payload = JSON.stringify([
      { type: 'token', trigger: '@', item: { id: 'c', label: 'Composer.tsx' } },
    ])
    fireEvent.paste(editor, {
      clipboardData: {
        files: [],
        getData: (type: string) =>
          type === 'text/plain' ? '@Composer.tsx' : payload,
      },
    })
    expect(tokenHosts(editor)).toHaveLength(1)
    expect(onValueChange).toHaveBeenLastCalledWith([
      { type: 'text', text: 'Hi ' },
      { type: 'token', trigger: '@', item: { id: 'c', label: 'Composer.tsx' } },
    ])
    expect(visibleText(editor)).toBe('Hi @Composer.tsx')
  })
})

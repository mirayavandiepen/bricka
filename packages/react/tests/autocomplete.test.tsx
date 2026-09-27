import { act, cleanup, fireEvent } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AutocompleteRequest, AutocompleteSource } from '../src'
import {
  advance,
  deferred,
  item,
  press,
  renderComposer,
  setCaret,
  type,
  visibleText,
} from './helpers/render'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

function ghostText(): string | null {
  return document.querySelector('.bricka-ghost-text')?.textContent ?? null
}

function setup(autocomplete: AutocompleteSource, extra = {}) {
  const onValueChange = vi.fn()
  const onError = vi.fn()
  const utils = renderComposer({
    composer: { onValueChange, onError },
    input: {
      autocomplete: { suggest: autocomplete, delay: 300 },
      triggers: [{ char: '@', items: [item('a', 'alpha')] }],
      ...extra,
    },
  })
  act(() => utils.editor.focus())
  return { ...utils, onValueChange, onError }
}

describe('requesting', () => {
  it('waits for a pause, then sends trailing text and a signal', async () => {
    const suggest = vi.fn(() => ' world')
    const { editor } = setup(suggest)
    type(editor, 'hel')
    await advance(200)
    type(editor, 'lo')
    await advance(299)
    expect(suggest).not.toHaveBeenCalled()
    await advance(1)
    expect(suggest).toHaveBeenCalledOnce()
    const request = (
      suggest.mock.calls[0] as unknown as [AutocompleteRequest]
    )[0]
    expect(request.text).toBe('hello')
    expect(request.signal).toBeInstanceOf(AbortSignal)
    expect(ghostText()).toBe(' world')
  })

  it('includes tokens in the text context', async () => {
    const suggest = vi.fn(() => null)
    const { editor } = setup(suggest)
    type(editor, 'ask @')
    press(editor, 'Enter')
    type(editor, 'about')
    await advance(300)
    const request = (
      suggest.mock.calls[0] as unknown as [AutocompleteRequest]
    )[0]
    expect(request.text).toBe('ask @alpha about')
  })

  it('only suggests when the caret is at the end', async () => {
    const suggest = vi.fn(() => 'x')
    const { editor } = setup(suggest)
    type(editor, 'hello')
    setCaret(editor.firstChild!, 2)
    type(editor, 'y')
    await advance(300)
    expect(suggest).not.toHaveBeenCalled()
  })

  it('respects minLength and trims context', async () => {
    const suggest = vi.fn(() => 'x')
    const { editor } = renderComposer({
      input: {
        autocomplete: { suggest, minLength: 3, contextLength: 4, delay: 0 },
      },
    })
    act(() => editor.focus())
    type(editor, 'ab')
    await advance(0)
    expect(suggest).not.toHaveBeenCalled()
    type(editor, 'cdef')
    await advance(0)
    expect(
      (suggest.mock.calls[0] as unknown as [AutocompleteRequest])[0].text
    ).toBe('cdef')
  })

  it('accepts a plain function', async () => {
    const { editor } = renderComposer({
      input: { autocomplete: () => ' done' },
    })
    act(() => editor.focus())
    type(editor, 'nearly')
    await advance(300)
    expect(ghostText()).toBe(' done')
  })
})

describe('keyboard', () => {
  it('accepts with Tab and records the text', async () => {
    const { editor, onValueChange } = setup(() => ' world')
    type(editor, 'hello')
    await advance(300)
    press(editor, 'Tab')
    expect(ghostText()).toBeNull()
    expect(visibleText(editor)).toBe('hello world')
    expect(onValueChange).toHaveBeenLastCalledWith([
      { type: 'text', text: 'hello world' },
    ])
  })

  it('cycles multiple suggestions with Shift+Tab and shows a counter', async () => {
    const { editor } = setup(() => [' one', ' two', ''])
    type(editor, 'pick')
    await advance(300)
    expect(document.querySelector('.bricka-ghost-count')?.textContent).toBe(
      '1/2'
    )
    press(editor, 'Tab', { shiftKey: true })
    expect(ghostText()).toBe(' two')
    press(editor, 'Tab', { shiftKey: true })
    expect(ghostText()).toBe(' one')
  })

  it('leaves Shift+Tab alone for a single suggestion', async () => {
    const { editor } = setup(() => ' one')
    type(editor, 'pick')
    await advance(300)
    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    })
    editor.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
  })

  it('dismisses with Escape without changing the value', async () => {
    const { editor, onValueChange } = setup(() => ' world')
    type(editor, 'hello')
    await advance(300)
    const calls = onValueChange.mock.calls.length
    press(editor, 'Escape')
    expect(ghostText()).toBeNull()
    expect(onValueChange).toHaveBeenCalledTimes(calls)
  })

  it('lets Tab move focus when there is no suggestion', () => {
    const { editor } = setup(() => null)
    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    })
    editor.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
  })

  it('accepts on pointer down on the ghost text', async () => {
    const { editor } = setup(() => ' world')
    type(editor, 'hello')
    await advance(300)
    fireEvent.pointerDown(document.querySelector('.bricka-ghost-text')!)
    expect(visibleText(editor)).toBe('hello world')
  })

  it('submits as typed when Enter is pressed with a visible ghost', async () => {
    const onSubmit = vi.fn()
    const { editor } = renderComposer({
      composer: { onSubmit },
      input: { autocomplete: () => ' world' },
    })
    act(() => editor.focus())
    type(editor, 'hello')
    await advance(300)
    press(editor, 'Enter')
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'hello' })
    )
  })
})

describe('staleness and cancellation', () => {
  it('aborts in-flight requests when typing continues', async () => {
    const pending = deferred<string>()
    let signal: AbortSignal | undefined
    const { editor } = setup((request) => {
      signal = request.signal
      return pending.promise
    })
    type(editor, 'hel')
    await advance(300)
    type(editor, 'l')
    expect(signal?.aborted).toBe(true)
    await act(async () => pending.resolve(' stale'))
    expect(ghostText()).toBeNull()
  })

  it('never shows results for text that has changed', async () => {
    const first = deferred<string>()
    const second = deferred<string>()
    let call = 0
    const { editor } = setup(() =>
      ++call === 1 ? first.promise : second.promise
    )
    type(editor, 'a')
    await advance(300)
    type(editor, 'b')
    await advance(300)
    await act(async () => first.resolve(' old'))
    expect(ghostText()).toBeNull()
    await act(async () => second.resolve(' new'))
    expect(ghostText()).toBe(' new')
  })

  it('clears visible ghost text immediately on input', async () => {
    const { editor } = setup(() => ' world')
    type(editor, 'hello')
    await advance(300)
    type(editor, '!')
    expect(ghostText()).toBeNull()
  })

  it('is suppressed while a trigger menu is open', async () => {
    const suggest = vi.fn(() => 'x')
    const { editor } = setup(suggest)
    type(editor, 'hi @')
    await advance(300)
    expect(suggest).not.toHaveBeenCalled()
  })

  it('cancels when the menu opens after a request started', async () => {
    const pending = deferred<string>()
    const { editor } = setup(() => pending.promise)
    type(editor, 'hi')
    await advance(300)
    type(editor, ' @')
    await act(async () => pending.resolve(' there'))
    expect(ghostText()).toBeNull()
  })

  it('aborts on blur and on unmount', async () => {
    const signals: Array<AbortSignal> = []
    const { editor, unmount } = setup((request) => {
      signals.push(request.signal)
      return new Promise<string>(() => {})
    })
    type(editor, 'x')
    await advance(300)
    fireEvent.blur(editor)
    expect(signals[0].aborted).toBe(true)
    act(() => editor.focus())
    type(editor, 'y')
    await advance(300)
    unmount()
    expect(signals[1].aborted).toBe(true)
  })

  it('ignores empty results and reports errors', async () => {
    const failure = new Error('rate limited')
    let call = 0
    const { editor, onError } = setup(() => {
      call++
      if (call === 1) return ['', '']
      return Promise.reject(failure)
    })
    type(editor, 'a')
    await advance(300)
    expect(document.querySelector('.bricka-ghost')).toBeNull()
    type(editor, 'b')
    await advance(300)
    expect(document.querySelector('.bricka-ghost')).toBeNull()
    expect(onError).toHaveBeenCalledWith(failure, 'autocomplete')
  })

  it('shows a loading state while waiting', async () => {
    const { editor } = setup(() => new Promise<string>(() => {}))
    type(editor, 'a')
    await advance(300)
    expect(
      document.querySelector('.bricka-ghost')?.getAttribute('data-status')
    ).toBe('loading')
    expect(document.querySelector('.bricka-ghost-loading')).not.toBeNull()
  })

  it('does not request during IME composition', async () => {
    const suggest = vi.fn(() => 'x')
    const { editor } = setup(suggest)
    fireEvent.compositionStart(editor)
    type(editor, 'か')
    await advance(300)
    expect(suggest).not.toHaveBeenCalled()
  })
})

describe('streaming', () => {
  it('appends streamed chunks and accepts the partial text', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    async function* stream() {
      yield ' and'
      yield ' then'
      await gate
      yield ' more'
    }
    const { editor } = setup(() => stream())
    type(editor, 'first')
    await advance(300)
    expect(ghostText()).toBe(' and then')
    expect(
      document.querySelector('.bricka-ghost')?.getAttribute('data-status')
    ).toBe('streaming')
    await act(async () => release())
    expect(ghostText()).toBe(' and then more')
    expect(
      document.querySelector('.bricka-ghost')?.getAttribute('data-status')
    ).toBe('ready')
    press(editor, 'Tab')
    expect(visibleText(editor)).toBe('first and then more')
  })

  it('stops consuming the stream when the text changes', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    const finished = vi.fn()
    async function* stream() {
      try {
        yield ' a'
        await gate
        yield ' b'
      } finally {
        finished()
      }
    }
    const { editor } = setup(() => stream())
    type(editor, 'x')
    await advance(300)
    type(editor, 'y')
    await act(async () => release())
    expect(finished).toHaveBeenCalled()
    expect(ghostText()).toBeNull()
  })
})

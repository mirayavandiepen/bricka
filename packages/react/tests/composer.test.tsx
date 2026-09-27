import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  Composer,
  ComposerInput,
  useComposer,
  type ComposerValue,
} from '../src'
import {
  caretToEnd,
  flush,
  item,
  press,
  renderComposer,
  tokenHosts,
  type,
  visibleText,
} from './helpers/render'

afterEach(cleanup)

describe('rendering and semantics', () => {
  it('renders an accessible multiline textbox', () => {
    const { editor } = renderComposer()
    expect(editor.getAttribute('role')).toBe('textbox')
    expect(editor.getAttribute('aria-multiline')).toBe('true')
    expect(editor.getAttribute('aria-label')).toBe('Message')
    expect(editor.getAttribute('aria-placeholder')).toBe('Message')
    expect(editor.isContentEditable || editor.contentEditable === 'true').toBe(
      true
    )
  })

  it('marks the input empty for the placeholder and clears it on typing', () => {
    const { editor } = renderComposer()
    expect(editor.hasAttribute('data-empty')).toBe(true)
    type(editor, ' ')
    expect(editor.hasAttribute('data-empty')).toBe(false)
  })

  it('uses single-line semantics and a send key hint', () => {
    const { editor, container } = renderComposer({
      input: { singleLine: true },
    })
    expect(editor.getAttribute('aria-multiline')).toBe('false')
    expect(editor.getAttribute('enterkeyhint')).toBe('send')
    expect(container.querySelector('[data-single-line]')).not.toBeNull()
  })

  it('renders default value with tokens', () => {
    const { editor } = renderComposer({
      composer: {
        defaultValue: [
          { type: 'text', text: 'Fix ' },
          { type: 'token', trigger: '@', item: item('c', 'Composer.tsx') },
        ],
      },
    })
    expect(tokenHosts(editor)).toHaveLength(1)
    expect(visibleText(editor)).toBe('Fix @Composer.tsx')
  })
})

describe('value', () => {
  it('reports typed text through onValueChange', () => {
    const onValueChange = vi.fn()
    const { editor } = renderComposer({ composer: { onValueChange } })
    type(editor, 'hello')
    expect(onValueChange).toHaveBeenLastCalledWith([
      { type: 'text', text: 'hello' },
    ])
  })

  it('keeps multiline text', () => {
    const onValueChange = vi.fn()
    const { editor } = renderComposer({ composer: { onValueChange } })
    editor.innerHTML = 'one<div>two</div>'
    fireEvent.input(editor)
    expect(onValueChange).toHaveBeenLastCalledWith([
      { type: 'text', text: 'one\ntwo' },
    ])
  })

  it('does not report unchanged content', () => {
    const onValueChange = vi.fn()
    const { editor } = renderComposer({ composer: { onValueChange } })
    type(editor, 'a')
    fireEvent.input(editor)
    expect(onValueChange).toHaveBeenCalledTimes(1)
  })

  it('supports controlled values and preserves DOM for equal content', () => {
    function Controlled() {
      const [value, setValue] = useState<ComposerValue>([
        { type: 'text', text: 'start' },
      ])
      return (
        <>
          <Composer value={value} onValueChange={setValue}>
            <ComposerInput />
          </Composer>
          <button onClick={() => setValue([{ type: 'text', text: 'reset' }])}>
            reset
          </button>
        </>
      )
    }
    const { container } = render(<Controlled />)
    const editor = container.querySelector<HTMLElement>('.bricka-input')!
    const node = editor.firstChild
    type(editor, '!')
    expect(editor.firstChild).toBe(node)
    expect(visibleText(editor)).toBe('start!')

    fireEvent.click(screen.getByText('reset'))
    expect(visibleText(editor)).toBe('reset')
  })

  it('refreshes token data when an item changes but the id stays', () => {
    function Relabel() {
      const [label, setLabel] = useState('old')
      return (
        <>
          <Composer
            value={[{ type: 'token', trigger: '@', item: item('a', label) }]}
          >
            <ComposerInput />
          </Composer>
          <button onClick={() => setLabel('new')}>rename</button>
        </>
      )
    }
    const { container } = render(<Relabel />)
    fireEvent.click(screen.getByText('rename'))
    expect(container.querySelector('.bricka-token-label')?.textContent).toBe(
      'new'
    )
  })
})

describe('submit', () => {
  it('submits on Enter and clears', () => {
    const onSubmit = vi.fn()
    const { editor } = renderComposer({ composer: { onSubmit } })
    type(editor, 'ship it')
    press(editor, 'Enter')
    expect(onSubmit).toHaveBeenCalledWith({
      value: [{ type: 'text', text: 'ship it' }],
      text: 'ship it',
      attachments: [],
    })
    expect(visibleText(editor)).toBe('')
  })

  it('inserts a newline on Shift+Enter', () => {
    const onSubmit = vi.fn()
    const { editor } = renderComposer({ composer: { onSubmit } })
    type(editor, 'a')
    press(editor, 'Enter', { shiftKey: true })
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('uses Cmd/Ctrl+Enter with submitKey="mod+enter"', () => {
    const onSubmit = vi.fn()
    const { editor } = renderComposer({
      composer: { onSubmit },
      input: { submitKey: 'mod+enter' },
    })
    type(editor, 'draft')
    press(editor, 'Enter')
    expect(onSubmit).not.toHaveBeenCalled()
    press(editor, 'Enter', { ctrlKey: true })
    press(editor, 'Enter', { metaKey: true })
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('ignores empty content and key repeat', () => {
    const onSubmit = vi.fn()
    const { editor } = renderComposer({ composer: { onSubmit } })
    type(editor, '   ')
    press(editor, 'Enter')
    type(editor, 'x')
    press(editor, 'Enter', { repeat: true })
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('keeps content when clearOnSubmit is false', () => {
    const onSubmit = vi.fn()
    const { editor } = renderComposer({
      composer: { onSubmit, clearOnSubmit: false },
    })
    type(editor, 'keep')
    press(editor, 'Enter')
    expect(visibleText(editor)).toBe('keep')
  })

  it('disables the submit button while empty', () => {
    const { editor, getByRole } = renderComposer()
    const button = getByRole('button', { name: 'Send' }) as HTMLButtonElement
    expect(button.disabled).toBe(true)
    type(editor, 'x')
    expect(button.disabled).toBe(false)
  })

  it('submits from the button', () => {
    const onSubmit = vi.fn()
    const { editor, getByRole } = renderComposer({ composer: { onSubmit } })
    type(editor, 'go')
    fireEvent.click(getByRole('button', { name: 'Send' }))
    expect(onSubmit).toHaveBeenCalledOnce()
  })
})

describe('IME composition', () => {
  it('does not submit on Enter while composing', () => {
    const onSubmit = vi.fn()
    const { editor } = renderComposer({ composer: { onSubmit } })
    type(editor, 'にほん')
    fireEvent.compositionStart(editor)
    press(editor, 'Enter')
    fireEvent.compositionEnd(editor)
    press(editor, 'Enter', { keyCode: 229 })
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('does not open menus mid-composition and evaluates after it ends', () => {
    const { editor } = renderComposer({
      input: { triggers: [{ char: '@', items: [item('a', 'alpha')] }] },
    })
    fireEvent.compositionStart(editor)
    type(editor, '@')
    expect(document.querySelector('[role="listbox"]')).toBeNull()
    fireEvent.compositionEnd(editor)
    expect(document.querySelector('[role="listbox"]')).not.toBeNull()
  })
})

describe('focus', () => {
  it('moves the caret to the end on keyboard focus', async () => {
    const { editor } = renderComposer({
      composer: { defaultValue: [{ type: 'text', text: 'hello' }] },
    })
    document.getSelection()?.removeAllRanges()
    editor.focus()
    fireEvent.focus(editor)
    await flush()
    const trailing = document.getSelection()!.getRangeAt(0).cloneRange()
    trailing.setEnd(editor, editor.childNodes.length)
    expect(trailing.collapsed || trailing.toString() === '').toBe(true)
  })

  it('focuses the input when empty composer chrome is clicked', () => {
    const { container, editor } = renderComposer()
    fireEvent.mouseDown(container.querySelector('.bricka-footer')!)
    expect(document.activeElement).toBe(editor)
  })

  it('autofocuses', () => {
    const { editor } = renderComposer({ input: { autoFocus: true } })
    expect(document.activeElement).toBe(editor)
  })
})

describe('disabled', () => {
  it('is not editable or submittable', () => {
    const onSubmit = vi.fn()
    const { editor, container } = renderComposer({
      composer: {
        disabled: true,
        onSubmit,
        defaultValue: [{ type: 'text', text: 'x' }],
      },
    })
    expect(editor.getAttribute('contenteditable')).toBe('false')
    expect(editor.getAttribute('aria-disabled')).toBe('true')
    expect(container.querySelector('[data-disabled]')).not.toBeNull()
    act(() => {
      editor.focus()
    })
    press(editor, 'Enter')
    expect(onSubmit).not.toHaveBeenCalled()
  })
})

describe('imperative API', () => {
  it('inserts text and tokens at the caret', () => {
    const onValueChange = vi.fn()
    const { editor, api } = renderComposer({ composer: { onValueChange } })
    act(() => api().insertText('Review '))
    act(() => api().insertToken(item('pr', 'PR #42'), '#'))
    expect(onValueChange).toHaveBeenLastCalledWith([
      { type: 'text', text: 'Review ' },
      { type: 'token', trigger: '#', item: item('pr', 'PR #42') },
      { type: 'text', text: ' ' },
    ])
    expect(api().getText()).toBe('Review #PR #42 ')
    expect(tokenHosts(editor)).toHaveLength(1)
  })

  it('clears and sets values', () => {
    const { editor, api } = renderComposer()
    act(() => api().setValue([{ type: 'text', text: 'set' }]))
    expect(visibleText(editor)).toBe('set')
    act(() => api().clear())
    expect(visibleText(editor)).toBe('')
    expect(api().getValue()).toEqual([])
  })

  it('opens a trigger menu programmatically with a separating space', () => {
    const { editor, api } = renderComposer({
      input: { triggers: [{ char: '/', items: [item('fix')] }] },
      composer: { defaultValue: [{ type: 'text', text: 'please' }] },
    })
    act(() => {
      editor.focus()
      caretToEnd(editor)
    })
    act(() => api().openTrigger('/'))
    expect(visibleText(editor)).toBe('please /')
    expect(document.querySelector('[role="listbox"]')).not.toBeNull()
  })

  it('exposes state through useComposer', () => {
    function Count() {
      const { value, canSubmit } = useComposer()
      return <output>{`${value.length}:${String(canSubmit)}`}</output>
    }
    const { editor } = renderComposer({ children: <Count /> })
    expect(document.querySelector('output')?.textContent).toBe('0:false')
    type(editor, 'x')
    expect(document.querySelector('output')?.textContent).toBe('1:true')
  })

  it('throws a helpful error outside a Composer', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<ComposerInput />)).toThrow(/inside <Composer>/)
    vi.mocked(console.error).mockRestore()
  })
})

describe('formatting', () => {
  it('blocks rich formatting shortcuts via beforeinput', () => {
    const { editor } = renderComposer()
    const event = new InputEvent('beforeinput', {
      inputType: 'formatBold',
      cancelable: true,
    })
    editor.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
  })
})

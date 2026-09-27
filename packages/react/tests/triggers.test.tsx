import { act, cleanup, fireEvent } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ContextItem, Trigger } from '../src'
import {
  advance,
  deferred,
  flush,
  item,
  listbox,
  options,
  press,
  renderComposer,
  tokenHosts,
  type,
  visibleText,
} from './helpers/render'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const files: Array<ContextItem> = [
  item('pkg', 'package.json', { type: 'file' }),
  item('composer', 'Composer.tsx', {
    type: 'file',
    description: 'src/components',
  }),
  item('readme', 'README.md', { type: 'file' }),
]

const mentions: Trigger = { char: '@', label: 'Mentions', items: files }
const commands: Trigger = {
  char: '/',
  label: 'Commands',
  items: [item('explain'), item('fix'), item('summarize')],
}

function setup(triggers: Array<Trigger> = [mentions, commands], extra = {}) {
  const onValueChange = vi.fn()
  const utils = renderComposer({
    composer: { onValueChange, ...extra },
    input: { triggers },
  })
  return { ...utils, onValueChange }
}

describe('opening', () => {
  it('opens a labelled listbox when @ is typed', () => {
    const { editor } = setup()
    type(editor, 'Fix @')
    expect(listbox()?.getAttribute('aria-label')).toBe('Mentions')
    expect(options().map((o) => o.textContent)).toEqual([
      'package.json',
      'Composer.tsxsrc/components',
      'README.md',
    ])
  })

  it('wires combobox-style ARIA on the textbox', () => {
    const { editor } = setup()
    expect(editor.getAttribute('aria-autocomplete')).toBe('list')
    expect(editor.getAttribute('aria-haspopup')).toBe('listbox')
    type(editor, '@')
    expect(editor.getAttribute('aria-controls')).toBe(listbox()?.id)
    expect(editor.getAttribute('aria-activedescendant')).toBe(options()[0].id)
    expect(options()[0].getAttribute('aria-selected')).toBe('true')
  })

  it('does not open inside words', () => {
    const { editor } = setup()
    type(editor, 'mail@')
    expect(listbox()).toBeNull()
  })

  it('does not open for unregistered characters', () => {
    const { editor } = setup([mentions])
    type(editor, '/')
    expect(listbox()).toBeNull()
  })

  it('opens with a keyboard shortcut when configured', () => {
    const { editor } = setup([{ ...commands, shortcut: 'ctrl+k' }])
    act(() => editor.focus())
    press(editor, 'k', { ctrlKey: true })
    expect(visibleText(editor)).toBe('/')
    expect(listbox()?.getAttribute('aria-label')).toBe('Commands')
  })
})

describe('filtering', () => {
  it('fuzzy-filters static items as the query grows', () => {
    const { editor } = setup()
    type(editor, '@comp')
    expect(options().map((o) => o.textContent)).toEqual([
      'Composer.tsxsrc/components',
    ])
    expect(document.querySelector('.inlay-match')?.textContent).toBe('Comp')
  })

  it('shows an empty state', () => {
    const { editor } = setup()
    type(editor, '@zzz')
    expect(options()).toHaveLength(0)
    expect(document.querySelector('.inlay-menu-notice')?.textContent).toBe(
      'No results'
    )
  })

  it('applies a custom filter and limit', () => {
    const filter = vi.fn((items: Array<ContextItem>) => items.slice().reverse())
    const { editor } = setup([{ ...mentions, filter, limit: 2 }])
    type(editor, '@x')
    expect(filter).toHaveBeenCalledWith(files, 'x')
    expect(options()).toHaveLength(2)
  })

  it('groups items under headings', () => {
    const grouped: Trigger = {
      char: '@',
      items: [
        item('a', 'alpha', { group: 'Files' }),
        item('p', 'Priya', { group: 'People' }),
        item('b', 'beta', { group: 'Files' }),
      ],
    }
    const { editor } = setup([grouped])
    type(editor, '@')
    const groups = document.querySelectorAll('[role="group"]')
    expect(groups).toHaveLength(2)
    expect(groups[0].getAttribute('aria-labelledby')).toBeTruthy()
    expect(options().map((o) => o.textContent)).toEqual([
      'alpha',
      'beta',
      'Priya',
    ])
  })
})

describe('async loading', () => {
  it('passes the query and an abort signal, and shows loading', async () => {
    const request = deferred<Array<ContextItem>>()
    const load = vi.fn(() => request.promise)
    const { editor } = setup([{ char: '@', items: load }])
    type(editor, '@re')
    expect(load).toHaveBeenCalledWith({
      query: 're',
      signal: expect.any(AbortSignal),
    })
    expect(
      document.querySelector('.inlay-menu')?.getAttribute('data-status')
    ).toBe('loading')
    expect(document.querySelector('.inlay-menu-notice')?.textContent).toBe(
      'Loading…'
    )
    await act(async () => request.resolve(files))
    expect(options()).toHaveLength(3)
  })

  it('aborts and ignores stale responses', async () => {
    const first = deferred<Array<ContextItem>>()
    const second = deferred<Array<ContextItem>>()
    const signals: Array<AbortSignal> = []
    const load = vi.fn(({ signal }: { signal: AbortSignal }) => {
      signals.push(signal)
      return signals.length === 1 ? first.promise : second.promise
    })
    const { editor } = setup([{ char: '@', items: load }])
    type(editor, '@r')
    type(editor, 'e')
    expect(signals[0].aborted).toBe(true)
    await act(async () => second.resolve([item('new', 'fresh')]))
    await act(async () => first.resolve([item('old', 'stale')]))
    expect(options().map((o) => o.textContent)).toEqual(['fresh'])
  })

  it('keeps previous results visible while the next query loads', async () => {
    const pending = deferred<Array<ContextItem>>()
    let call = 0
    const load = () => (++call === 1 ? files : pending.promise)
    const { editor } = setup([{ char: '@', items: load }])
    type(editor, '@')
    type(editor, 'r')
    expect(options()).toHaveLength(3)
    expect(document.querySelector('.inlay-menu-progress')).not.toBeNull()
    await act(async () => pending.resolve([files[2]]))
    expect(options()).toHaveLength(1)
  })

  it('debounces loaders', async () => {
    vi.useFakeTimers()
    const load = vi.fn(() => files)
    const { editor } = setup([{ char: '@', items: load, debounce: 100 }])
    type(editor, '@a')
    type(editor, 'b')
    expect(load).not.toHaveBeenCalled()
    await advance(100)
    expect(load).toHaveBeenCalledOnce()
    expect(load).toHaveBeenCalledWith(expect.objectContaining({ query: 'ab' }))
  })

  it('reports failures without breaking the input', async () => {
    const onError = vi.fn()
    const failure = new Error('offline')
    const { editor, onValueChange } = setup(
      [{ char: '@', items: () => Promise.reject(failure) }],
      { onError }
    )
    type(editor, '@x')
    await flush()
    expect(onError).toHaveBeenCalledWith(failure, 'trigger')
    expect(document.querySelector('.inlay-menu-notice')?.textContent).toBe(
      'Couldn’t load results'
    )
    type(editor, 'y')
    expect(onValueChange).toHaveBeenLastCalledWith([
      { type: 'text', text: '@xy' },
    ])
  })

  it('handles thousands of items and caps rendering', () => {
    const many = Array.from({ length: 5000 }, (_, i) =>
      item(String(i), `file-${i}.ts`)
    )
    const { editor } = setup([{ char: '@', items: many }])
    type(editor, '@file')
    expect(options()).toHaveLength(50)
  })
})

describe('keyboard', () => {
  it('navigates with arrows, wraps, and skips disabled items', () => {
    const { editor } = setup([
      {
        char: '@',
        items: [item('a'), item('b', 'b', { disabled: true }), item('c')],
      },
    ])
    type(editor, '@')
    const active = () =>
      options().findIndex((o) => o.hasAttribute('data-active'))
    expect(active()).toBe(0)
    press(editor, 'ArrowDown')
    expect(active()).toBe(2)
    press(editor, 'ArrowDown')
    expect(active()).toBe(0)
    press(editor, 'ArrowUp')
    expect(active()).toBe(2)
    press(editor, 'p', { ctrlKey: true })
    expect(active()).toBe(0)
  })

  it('inserts the active item on Enter as an inline token', () => {
    const { editor, onValueChange } = setup()
    type(editor, 'Fix @comp')
    press(editor, 'Enter')
    expect(listbox()).toBeNull()
    expect(tokenHosts(editor)).toHaveLength(1)
    expect(onValueChange).toHaveBeenLastCalledWith([
      { type: 'text', text: 'Fix ' },
      { type: 'token', trigger: '@', item: files[1] },
      { type: 'text', text: ' ' },
    ])
  })

  it('inserts on Tab and continues typing after the token', () => {
    const { editor, onValueChange } = setup()
    type(editor, '@')
    press(editor, 'Tab')
    type(editor, 'please')
    expect(onValueChange).toHaveBeenLastCalledWith([
      { type: 'token', trigger: '@', item: files[0] },
      { type: 'text', text: ' please' },
    ])
  })

  it('does not add a second space when one already follows', () => {
    const { editor, onValueChange } = setup()
    type(editor, '@ tail')
    const text = editor.firstChild as Text
    const range = document.createRange()
    range.setStart(text, 1)
    range.collapse(true)
    document.getSelection()!.removeAllRanges()
    document.getSelection()!.addRange(range)
    fireEvent.input(editor)
    press(editor, 'Enter')
    expect(onValueChange).toHaveBeenLastCalledWith([
      { type: 'token', trigger: '@', item: files[0] },
      { type: 'text', text: ' tail' },
    ])
  })

  it('dismisses on Escape, keeps the text, and stays closed for that trigger', () => {
    const { editor } = setup()
    type(editor, '@re')
    const outer = vi.fn()
    document.addEventListener('keydown', outer)
    press(editor, 'Escape')
    document.removeEventListener('keydown', outer)
    expect(outer).not.toHaveBeenCalled()
    expect(listbox()).toBeNull()
    type(editor, 'a')
    expect(listbox()).toBeNull()
    expect(visibleText(editor)).toBe('@rea')
    type(editor, ' @')
    expect(listbox()).not.toBeNull()
  })

  it('closes on whitespace and when moving the caret', () => {
    const { editor } = setup()
    type(editor, '@re')
    type(editor, ' ')
    expect(listbox()).toBeNull()
    type(editor, '@')
    press(editor, 'ArrowLeft')
    expect(listbox()).toBeNull()
  })

  it('lets Enter submit when nothing matches', () => {
    const onSubmit = vi.fn()
    const { editor } = setup([mentions], { onSubmit })
    type(editor, '@zzz')
    press(editor, 'Enter')
    expect(onSubmit).toHaveBeenCalledOnce()
  })

  it('swallows Enter while results are still loading', () => {
    const onSubmit = vi.fn()
    const { editor } = setup(
      [{ char: '@', items: () => new Promise(() => {}) }],
      { onSubmit }
    )
    type(editor, '@a')
    press(editor, 'Enter')
    expect(onSubmit).not.toHaveBeenCalled()
  })
})

describe('mouse and touch', () => {
  it('highlights on pointer move and inserts on click without blurring', () => {
    const { editor } = setup()
    act(() => editor.focus())
    type(editor, '@')
    fireEvent.pointerMove(options()[2])
    expect(options()[2].hasAttribute('data-active')).toBe(true)
    const menu = document.querySelector('.inlay-menu')!
    const isDefaultAllowed = fireEvent.mouseDown(menu)
    expect(isDefaultAllowed).toBe(false)
    fireEvent.click(options()[2])
    expect(visibleText(editor)).toContain('README.md')
  })

  it('closes on outside pointer down and on blur', () => {
    const { editor } = setup()
    type(editor, '@')
    fireEvent.pointerDown(document.body)
    expect(listbox()).toBeNull()
    type(editor, ' @')
    fireEvent.blur(editor)
    expect(listbox()).toBeNull()
  })
})

describe('commands', () => {
  it('shares the menu system and inserts command tokens', () => {
    const { editor, onValueChange } = setup()
    type(editor, 'check /sum')
    expect(listbox()?.getAttribute('aria-label')).toBe('Commands')
    press(editor, 'Enter')
    expect(tokenHosts(editor)[0].dataset.trigger).toBe('/')
    expect(onValueChange).toHaveBeenLastCalledWith([
      { type: 'text', text: 'check ' },
      { type: 'token', trigger: '/', item: item('summarize') },
      { type: 'text', text: ' ' },
    ])
  })

  it('runs action commands without inserting a token', () => {
    const onSelect = vi.fn(() => false)
    const { editor, onValueChange } = setup([{ ...commands, onSelect }])
    type(editor, 'hi /fix')
    press(editor, 'Enter')
    expect(onSelect).toHaveBeenCalledWith(
      item('fix'),
      expect.objectContaining({ clear: expect.any(Function) })
    )
    expect(tokenHosts(editor)).toHaveLength(0)
    expect(onValueChange).toHaveBeenLastCalledWith([
      { type: 'text', text: 'hi ' },
    ])
  })

  it('lets actions use the composer after the query is removed', () => {
    const { editor, onValueChange } = setup([
      {
        ...commands,
        onSelect: (selected, composer) => {
          if (selected.id === 'explain') composer.insertText('Explain this: ')
          if (selected.id === 'fix') composer.clear()
          return false
        },
      },
    ])
    type(editor, 'code /expl')
    press(editor, 'Enter')
    expect(visibleText(editor)).toBe('code Explain this: ')
    type(editor, '/fix')
    press(editor, 'Enter')
    expect(visibleText(editor)).toBe('')
    expect(onValueChange).toHaveBeenLastCalledWith([])
  })

  it('renders custom items and tokens', () => {
    const { editor } = setup([
      {
        ...commands,
        renderItem: (entry, { isActive }) => (
          <b data-active-item={isActive}>{entry.label}!</b>
        ),
        renderToken: (entry) => <i>/{entry.label}</i>,
      },
    ])
    type(editor, '/')
    expect(options()[0].querySelector('b')?.textContent).toBe('explain!')
    press(editor, 'Enter')
    expect(editor.querySelector('i')?.textContent).toBe('/explain')
  })
})

describe('announcements', () => {
  it('announces result counts and inserted tokens', async () => {
    const { editor, container } = setup()
    const status = container.querySelector('[role="status"]')!
    type(editor, '@')
    await act(
      async () => new Promise((resolve) => requestAnimationFrame(resolve))
    )
    expect(status.textContent).toBe('3 results available')
    press(editor, 'Enter')
    await act(
      async () => new Promise((resolve) => requestAnimationFrame(resolve))
    )
    expect(status.textContent).toBe('Added package.json')
  })
})

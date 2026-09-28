import { act, fireEvent, render } from '@testing-library/react'
import { createRef, type ReactNode } from 'react'
import { vi } from 'vitest'
import {
  Composer,
  ComposerFooter,
  ComposerInput,
  ComposerSubmit,
  type ComposerApi,
  type ComposerInputProps,
  type ComposerProps,
  type ContextItem,
} from '../../src'
import { SENTINEL, TOKEN_ATTR } from '../../src/editor/dom'

export function item(
  id: string,
  label = id,
  extra: Partial<ContextItem> = {}
): ContextItem {
  return { id, label, ...extra }
}

export function renderComposer({
  composer,
  input,
  children,
}: {
  composer?: Partial<ComposerProps>
  input?: Partial<ComposerInputProps>
  children?: ReactNode
} = {}) {
  const ref = createRef<ComposerApi>()
  const utils = render(
    <Composer ref={ref} {...composer}>
      <ComposerInput placeholder="Message" {...input} />
      {children ?? (
        <ComposerFooter>
          <ComposerSubmit />
        </ComposerFooter>
      )}
    </Composer>
  )
  const editor = utils.container.querySelector<HTMLElement>('.bricka-input')!
  return { ...utils, editor, api: () => ref.current! }
}

export function setCaret(node: Node, offset: number): void {
  const range = document.createRange()
  range.setStart(node, offset)
  range.collapse(true)
  const selection = document.getSelection()!
  selection.removeAllRanges()
  selection.addRange(range)
}

export function caretToEnd(editor: HTMLElement): void {
  const range = document.createRange()
  range.selectNodeContents(editor)
  range.collapse(false)
  const selection = document.getSelection()!
  selection.removeAllRanges()
  selection.addRange(range)
}

/** Insert text at the caret like a keystroke would, then fire `input`. */
export function type(editor: HTMLElement, text: string): void {
  const selection = document.getSelection()!
  if (selection.rangeCount === 0 || !editor.contains(selection.anchorNode)) {
    if (document.activeElement !== editor) editor.focus()
    caretToEnd(editor)
  }
  const range = selection.getRangeAt(0)
  const { startContainer, startOffset } = range
  if (startContainer.nodeType === Node.TEXT_NODE) {
    const node = startContainer as Text
    node.data =
      node.data.slice(0, startOffset) + text + node.data.slice(startOffset)
    setCaret(node, startOffset + text.length)
  } else {
    const node = document.createTextNode(text)
    const before = startContainer.childNodes[startOffset] ?? null
    startContainer.insertBefore(node, before)
    setCaret(node, text.length)
  }
  fireEvent.input(editor)
}

export function press(
  editor: HTMLElement,
  key: string,
  init: Partial<KeyboardEventInit> = {}
): void {
  fireEvent.keyDown(editor, { key, ...init })
}

export function tokenHosts(editor: HTMLElement): Array<HTMLElement> {
  return Array.from(editor.querySelectorAll<HTMLElement>(`[${TOKEN_ATTR}]`))
}

export function visibleText(editor: HTMLElement): string {
  return (editor.textContent ?? '').split(SENTINEL).join('')
}

export async function flush(): Promise<void> {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

export async function advance(ms: number): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
}

export function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

export function listbox(): HTMLElement | null {
  return document.querySelector('[role="listbox"]')
}

export function options(): Array<HTMLElement> {
  return Array.from(document.querySelectorAll<HTMLElement>('[role="option"]'))
}

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  Composer,
  ComposerAttachButton,
  ComposerAttachments,
  ComposerFooter,
  ComposerInput,
  ComposerSubmit,
  type Attachment,
  type ComposerProps,
} from '../src'
import { formatBytes, matchesAccept } from '../src/composer/files'
import { press, renderComposer, type, visibleText } from './helpers/render'

afterEach(cleanup)

function file(name: string, type: string, size = 2048): File {
  return new File([new Uint8Array(size)], name, { type })
}

function renderWithFiles(props: Partial<ComposerProps> = {}) {
  return render(
    <Composer acceptFiles {...props}>
      <ComposerAttachments />
      <ComposerInput placeholder="Message" />
      <ComposerFooter>
        <ComposerAttachButton />
        <ComposerSubmit />
      </ComposerFooter>
    </Composer>
  )
}

function editorOf(container: HTMLElement): HTMLElement {
  return container.querySelector('.bricka-input')!
}

function paste(
  target: HTMLElement,
  data: { text?: string; files?: Array<File> }
) {
  fireEvent.paste(target, {
    clipboardData: {
      files: data.files ?? [],
      getData: (type: string) =>
        type === 'text/plain' ? (data.text ?? '') : '',
    },
  })
}

function dataTransfer(files: Array<File>) {
  return { files, types: ['Files'], dropEffect: 'none', getData: () => '' }
}

describe('helpers', () => {
  it('matches accept strings by extension, wildcard and exact type', () => {
    expect(matchesAccept(file('a.png', 'image/png'), 'image/*')).toBe(true)
    expect(matchesAccept(file('a.pdf', 'application/pdf'), '.pdf')).toBe(true)
    expect(matchesAccept(file('a.txt', 'text/plain'), 'image/*,.pdf')).toBe(
      false
    )
    expect(matchesAccept(file('a.txt', 'text/plain'), undefined)).toBe(true)
  })

  it('formats sizes', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(2048)).toBe('2.0 KB')
    expect(formatBytes(15 * 1024 * 1024)).toBe('15 MB')
  })
})

describe('paste', () => {
  it('inserts plain text only', () => {
    const onValueChange = vi.fn()
    const { editor } = renderComposer({ composer: { onValueChange } })
    act(() => editor.focus())
    fireEvent.paste(editor, {
      clipboardData: {
        files: [],
        getData: (type: string) =>
          type === 'text/html' ? '<b>bold</b>' : 'plain',
      },
    })
    expect(editor.querySelector('b')).toBeNull()
    expect(onValueChange).toHaveBeenLastCalledWith([
      { type: 'text', text: 'plain' },
    ])
  })

  it('keeps line breaks in multiline mode and trims the trailing one', () => {
    const onValueChange = vi.fn()
    const { editor } = renderComposer({ composer: { onValueChange } })
    act(() => editor.focus())
    paste(editor, { text: 'one\r\ntwo\n' })
    expect(onValueChange).toHaveBeenLastCalledWith([
      { type: 'text', text: 'one\ntwo' },
    ])
  })

  it('flattens line breaks in single-line mode', () => {
    const onValueChange = vi.fn()
    const { editor } = renderComposer({
      composer: { onValueChange },
      input: { singleLine: true },
    })
    act(() => editor.focus())
    paste(editor, { text: 'one\ntwo\n' })
    expect(onValueChange).toHaveBeenLastCalledWith([
      { type: 'text', text: 'one two' },
    ])
  })

  it('replaces the selected text and continues from the pasted end', () => {
    const { editor } = renderComposer({
      composer: { defaultValue: [{ type: 'text', text: 'hello world' }] },
    })
    act(() => editor.focus())
    const range = document.createRange()
    range.setStart(editor.firstChild!, 6)
    range.setEnd(editor.firstChild!, 11)
    document.getSelection()!.removeAllRanges()
    document.getSelection()!.addRange(range)
    paste(editor, { text: 'there' })
    type(editor, '!')
    expect(visibleText(editor)).toBe('hello there!')
  })

  it('lets onPaste take over, for example to turn URLs into tokens', () => {
    const onValueChange = vi.fn()
    const { editor } = renderComposer({
      composer: { onValueChange },
      input: {
        onPaste: (event, composer) => {
          if (!event.text.startsWith('https://')) return
          event.preventDefault()
          const url = new URL(event.text)
          composer.insertToken({
            id: event.text,
            label: url.hostname,
            type: 'url',
            text: event.text,
          })
        },
      },
    })
    act(() => editor.focus())
    paste(editor, { text: 'https://github.com/org/repo' })
    expect(onValueChange).toHaveBeenLastCalledWith([
      {
        type: 'token',
        item: {
          id: 'https://github.com/org/repo',
          label: 'github.com',
          type: 'url',
          text: 'https://github.com/org/repo',
        },
      },
      { type: 'text', text: ' ' },
    ])
  })

  it('turns pasted files into attachments with image previews', () => {
    const { container } = renderWithFiles()
    const editor = editorOf(container)
    act(() => editor.focus())
    paste(editor, { files: [file('shot.png', 'image/png')] })
    const attachment = screen.getByText('shot.png').closest('li')!
    expect(attachment.hasAttribute('data-image')).toBe(true)
    expect(attachment.querySelector('img')).not.toBeNull()
    expect(screen.getByText('2.0 KB')).toBeTruthy()
  })

  it('ignores pasted files when files are not accepted', () => {
    const onFiles = vi.fn()
    const { editor } = renderComposer({ composer: { onFiles } })
    act(() => editor.focus())
    paste(editor, { files: [file('a.png', 'image/png')] })
    expect(onFiles).not.toHaveBeenCalled()
  })
})

describe('attachments', () => {
  it('hands files to onFiles instead of attaching when provided', () => {
    const onFiles = vi.fn()
    const { container } = renderWithFiles({ onFiles, acceptFiles: 'image/*' })
    act(() => editorOf(container).focus())
    paste(editorOf(container), {
      files: [file('a.png', 'image/png'), file('b.txt', 'text/plain')],
    })
    expect(onFiles).toHaveBeenCalledWith(
      [expect.objectContaining({ name: 'a.png' })],
      'paste'
    )
    expect(container.querySelector('.bricka-attachments')).toBeNull()
  })

  it('removes attachments and submits them with the message', () => {
    const onSubmit = vi.fn()
    const onAttachmentsChange = vi.fn()
    const { container } = renderWithFiles({ onSubmit, onAttachmentsChange })
    const editor = editorOf(container)
    act(() => editor.focus())
    paste(editor, {
      files: [
        file('a.pdf', 'application/pdf'),
        file('b.pdf', 'application/pdf'),
      ],
    })
    fireEvent.click(screen.getByRole('button', { name: 'Remove a.pdf' }))
    expect(onAttachmentsChange).toHaveBeenLastCalledWith([
      expect.objectContaining({ name: 'b.pdf' }),
    ])

    const send = screen.getByRole<HTMLButtonElement>('button', { name: 'Send' })
    expect(send.disabled).toBe(false)
    press(editor, 'Enter')
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        text: '',
        attachments: [expect.objectContaining({ name: 'b.pdf' })],
      })
    )
    expect(container.querySelector('.bricka-attachments')).toBeNull()
  })

  it('blocks submit while an upload is pending and shows progress', () => {
    const onSubmit = vi.fn()
    const uploading: Array<Attachment> = [
      { id: '1', name: 'big.zip', status: 'uploading', progress: 0.4 },
    ]
    const { container } = renderWithFiles({
      onSubmit,
      defaultAttachments: uploading,
    })
    const editor = editorOf(container)
    type(editor, 'here')
    press(editor, 'Enter')
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText('Uploading 40%')).toBeTruthy()
    expect(container.querySelector('.bricka-attachment-progress')).not.toBeNull()
  })

  it('supports custom attachment rendering', () => {
    render(
      <Composer defaultAttachments={[{ id: '1', name: 'notes.md' }]}>
        <ComposerAttachments
          renderAttachment={(a, { remove }) => (
            <button onClick={remove}>{a.name}!</button>
          )}
        />
        <ComposerInput />
      </Composer>
    )
    fireEvent.click(screen.getByText('notes.md!'))
    expect(screen.queryByText('notes.md!')).toBeNull()
  })

  it('opens the file picker and attaches picked files', () => {
    const { container } = renderWithFiles({ acceptFiles: '.pdf' })
    const input =
      container.querySelector<HTMLInputElement>('input[type="file"]')!
    const click = vi.spyOn(input, 'click')
    fireEvent.click(screen.getByRole('button', { name: 'Attach files' }))
    expect(click).toHaveBeenCalled()
    expect(input.accept).toBe('.pdf')
    Object.defineProperty(input, 'files', {
      value: [file('spec.pdf', 'application/pdf')],
      configurable: true,
    })
    fireEvent.change(input)
    expect(screen.getByText('spec.pdf')).toBeTruthy()
  })
})

describe('drag and drop', () => {
  it('shows a drop state and hands dropped files to the host', () => {
    const onFiles = vi.fn()
    const { container } = renderWithFiles({ onFiles })
    const root = container.querySelector<HTMLElement>('.bricka-composer')!
    const files = [file('a.png', 'image/png')]
    fireEvent.dragEnter(root, { dataTransfer: dataTransfer(files) })
    expect(root.hasAttribute('data-dragging')).toBe(true)
    expect(screen.getByText('Drop files to attach')).toBeTruthy()
    fireEvent.drop(root, { dataTransfer: dataTransfer(files) })
    expect(root.hasAttribute('data-dragging')).toBe(false)
    expect(onFiles).toHaveBeenCalledWith(files, 'drop')
  })

  it('tracks nested drag enter and leave', () => {
    const { container } = renderWithFiles()
    const root = container.querySelector<HTMLElement>('.bricka-composer')!
    const transfer = dataTransfer([])
    fireEvent.dragEnter(root, { dataTransfer: transfer })
    fireEvent.dragEnter(editorOf(container), { dataTransfer: transfer })
    fireEvent.dragLeave(editorOf(container), { dataTransfer: transfer })
    expect(root.hasAttribute('data-dragging')).toBe(true)
    fireEvent.dragLeave(root, { dataTransfer: transfer })
    expect(root.hasAttribute('data-dragging')).toBe(false)
  })

  it('ignores drags when files are not accepted or when disabled', () => {
    const { container } = renderComposer()
    const root = container.querySelector<HTMLElement>('.bricka-composer')!
    fireEvent.dragEnter(root, { dataTransfer: dataTransfer([]) })
    expect(root.hasAttribute('data-dragging')).toBe(false)
    cleanup()
    const disabled = renderWithFiles({ disabled: true })
    const disabledRoot =
      disabled.container.querySelector<HTMLElement>('.bricka-composer')!
    fireEvent.dragEnter(disabledRoot, { dataTransfer: dataTransfer([]) })
    expect(disabledRoot.hasAttribute('data-dragging')).toBe(false)
  })
})

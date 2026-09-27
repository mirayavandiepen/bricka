import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type DragEvent,
  type FocusEvent,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import {
  getText,
  isEqual,
  normalizeValue,
  serialize,
  type SerializedSegment,
} from '../content'
import {
  getCaretIn,
  getCaretRect,
  getRangeIn,
  getTokenAfterCaret,
  getTokenBeforeCaret,
  setCaret,
  setCaretAtEnd,
  type TriggerMatch,
} from '../editor/caret'
import {
  collapseDoubleSpace,
  createTokenElement,
  isEditingArtifact,
  normalizePastedText,
  readDom,
  SENTINEL,
  stripSentinels,
  TOKEN_ATTR,
  TokenRegistry,
  trimTrailingNewlines,
  writeDom,
  type TokenEntry,
} from '../editor/dom'
import type {
  AutocompleteOptions,
  AutocompleteSource,
  ComposerPasteEvent,
  ComposerValue,
  ContextItem,
  SubmitKey,
  Trigger,
} from '../types'
import { useComposer, useInternals, type ComposerApi } from './context'
import { GhostText } from './ghost'
import { ComposerMenu, MenuContext, type MenuContextValue } from './menu'
import { isModKey, matchesShortcut } from './shortcut'
import { TokenView } from './token'
import { useAutocomplete } from './use-autocomplete'
import { useTriggerMenu } from './use-trigger-menu'

const CLIPBOARD_TYPE = 'application/x-inlay+json'
const NO_TRIGGERS: Array<Trigger> = []
const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect

type MountedToken = { key: string; element: HTMLElement; entry: TokenEntry }

export type ComposerInputProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'onPaste' | 'placeholder' | 'defaultValue'
> & {
  placeholder?: string
  /** Characters that open a suggestion menu, e.g. `@` mentions, `/` commands. */
  triggers?: Array<Trigger>
  /** Ghost-text suggestions shown after a pause in typing. */
  autocomplete?: AutocompleteSource | AutocompleteOptions
  /** `enter`: Enter sends, Shift+Enter breaks. `mod+enter`: ⌘/Ctrl+Enter sends. */
  submitKey?: SubmitKey
  singleLine?: boolean
  autoFocus?: boolean
  onPaste?: (event: ComposerPasteEvent, composer: ComposerApi) => void
  /** Suggestion popup. Pass `null` to render your own with `useComposerMenu`. */
  menu?: ReactNode
}

function isComposingEvent(event: KeyboardEvent<HTMLDivElement>): boolean {
  return event.nativeEvent.isComposing || event.keyCode === 229
}

function parseClipboardValue(raw: string): ComposerValue | null {
  try {
    const parsed = JSON.parse(raw) as Array<SerializedSegment>
    if (!Array.isArray(parsed)) return null
    const isValid = parsed.every(
      (segment) =>
        (segment.type === 'text' && typeof segment.text === 'string') ||
        (segment.type === 'token' &&
          typeof segment.item?.id === 'string' &&
          typeof segment.item.label === 'string')
    )
    return isValid ? parsed : null
  } catch {
    return null
  }
}

/** Native editing commands keep the browser's undo history intact. */
function execCommand(command: string, value?: string): boolean {
  if (typeof document.execCommand !== 'function') return false
  try {
    return document.execCommand(command, false, value)
  } catch {
    return false
  }
}

function setCaretAfter(node: Node): void {
  const parent = node.parentNode
  if (!parent) return
  setCaret(parent, Array.prototype.indexOf.call(parent.childNodes, node) + 1)
}

function nextVisibleText(node: Node): string {
  let sibling = node.nextSibling
  while (sibling?.nodeType === Node.TEXT_NODE) {
    const text = stripSentinels(sibling.textContent ?? '')
    if (text.length > 0) return text
    sibling = sibling.nextSibling
  }
  return ''
}

export function ComposerInput({
  placeholder,
  triggers = NO_TRIGGERS,
  autocomplete,
  submitKey = 'enter',
  singleLine = false,
  autoFocus = false,
  onPaste,
  menu: menuElement = <ComposerMenu />,
  className,
  onKeyDown,
  onFocus,
  onBlur,
  ...rest
}: ComposerInputProps) {
  const composer = useComposer()
  const internals = useInternals()
  const { value, isDisabled } = composer
  const { labels } = internals

  const editorRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const registryRef = useRef(new TokenRegistry())
  const committedRef = useRef<ComposerValue | null>(null)
  const selectedRef = useRef<HTMLElement | null>(null)
  const isComposingRef = useRef(false)
  const isPointerFocusRef = useRef(false)
  const pendingCommitRef = useRef(false)
  const [tokens, setTokens] = useState<Array<MountedToken>>([])
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  const triggersByChar = useMemo(
    () => new Map(triggers.map((trigger) => [trigger.char, trigger])),
    [triggers]
  )

  // --- DOM ↔ value ---

  function syncTokens(): void {
    const editor = editorRef.current
    if (!editor) return
    const next: Array<MountedToken> = []
    for (const element of editor.querySelectorAll<HTMLElement>(
      `[${TOKEN_ATTR}]`
    )) {
      const key = element.getAttribute(TOKEN_ATTR) ?? ''
      const entry = registryRef.current.get(key)
      if (entry) next.push({ key, element, entry })
    }
    setTokens((previous) =>
      previous.length === next.length &&
      previous.every(
        (token, i) =>
          token.element === next[i].element && token.entry === next[i].entry
      )
        ? previous
        : next
    )
  }

  function read(): ComposerValue {
    const editor = editorRef.current
    if (!editor) return []
    return normalizeValue(readDom(editor, registryRef.current))
  }

  function publish(next: ComposerValue): void {
    if (committedRef.current && isEqual(next, committedRef.current)) return
    committedRef.current = next
    internals.commit(next)
  }

  function revealCaret(): void {
    const editor = editorRef.current
    const range = editor && getCaretIn(editor)
    if (!editor || !range) return
    const caret = getCaretRect(range)
    if (!caret) return
    const box = editor.getBoundingClientRect()
    if (caret.bottom > box.bottom) editor.scrollTop += caret.bottom - box.bottom
    else if (caret.top < box.top) editor.scrollTop -= box.top - caret.top
    if (caret.right > box.right)
      editor.scrollLeft += caret.right - box.right + 2
    else if (caret.left < box.left) editor.scrollLeft -= box.left - caret.left
  }

  /** Read the DOM after an edit and react: menus first, then autocomplete. */
  function commit(): void {
    const next = read()
    publish(next)
    syncTokens()
    if (isComposingRef.current) return
    ghostEngine.cancel()
    menuEngine.update()
    if (!menuEngine.isOpen()) ghostEngine.schedule(next)
  }

  function commitSoon(): void {
    pendingCommitRef.current = true
    queueMicrotask(() => {
      if (!pendingCommitRef.current) return
      pendingCommitRef.current = false
      commit()
    })
  }

  // --- Token selection ---

  function selectToken(element: HTMLElement | null): void {
    const previous = selectedRef.current
    if (previous === element) return
    if (previous) delete previous.dataset.selected
    selectedRef.current = element
    if (element) element.dataset.selected = ''
    const editor = editorRef.current
    if (editor) editor.style.caretColor = element ? 'transparent' : ''
    setSelectedKey(element?.getAttribute(TOKEN_ATTR) ?? null)
  }

  function removeToken(element: HTMLElement): void {
    const editor = editorRef.current
    if (!editor) return
    menuEngine.close()
    selectToken(null)
    const entry = registryRef.current.get(
      element.getAttribute(TOKEN_ATTR) ?? ''
    )

    const marker = document.createComment('')
    element.before(marker)
    let sibling = element.nextSibling
    while (sibling && isEditingArtifact(sibling)) {
      const next = sibling.nextSibling
      sibling.remove()
      sibling = next
    }
    element.remove()
    editor.normalize()
    collapseDoubleSpace(marker)

    const next = marker.nextSibling
    const previous = marker.previousSibling
    if (next?.nodeType === Node.TEXT_NODE) setCaret(next, 0)
    else if (previous?.nodeType === Node.TEXT_NODE) {
      setCaret(previous, previous.textContent?.length ?? 0)
    } else if (marker.parentNode) {
      const parent = marker.parentNode
      setCaret(parent, Array.prototype.indexOf.call(parent.childNodes, marker))
    }
    marker.remove()

    publish(trimTrailingNewlines(read()))
    syncTokens()
    ghostEngine.cancel()
    if (entry) internals.announce(labels.tokenRemoved(entry.item.label))
  }

  // --- Insertion ---

  function ensureCaret(): Range {
    const editor = editorRef.current!
    if (document.activeElement !== editor) editor.focus({ preventScroll: true })
    const range = getRangeIn(editor)
    if (range) return range
    setCaretAtEnd(editor)
    return getRangeIn(editor)!
  }

  function insertToken(entry: TokenEntry, range: Range): void {
    const editor = editorRef.current
    if (!editor) return
    selectToken(null)
    const element = createTokenElement(registryRef.current, entry)
    range.deleteContents()
    range.insertNode(element)

    const spacer = document.createTextNode(SENTINEL)
    element.after(spacer)
    if (/^\s/.test(nextVisibleText(spacer))) {
      setCaret(spacer, 1)
    } else {
      spacer.textContent = `${SENTINEL} ${SENTINEL}`
      setCaret(spacer, 2)
    }

    if (document.activeElement !== editor) editor.focus({ preventScroll: true })
    menuEngine.close()
    ghostEngine.cancel()
    publish(read())
    syncTokens()
    revealCaret()
    internals.announce(labels.tokenAdded(entry.item.label))
  }

  function insertText(text: string): void {
    const editor = editorRef.current
    if (!editor || text.length === 0) return
    const range = ensureCaret()
    selectToken(null)
    if (execCommand('insertText', text)) {
      commitSoon()
      return
    }
    range.deleteContents()
    const node = document.createTextNode(text)
    range.insertNode(node)
    setCaret(node, text.length)
    commit()
    revealCaret()
  }

  function insertValue(content: ComposerValue): void {
    if (!editorRef.current) return
    const range = ensureCaret()
    const fragment = writeDom(content, registryRef.current)
    const last = fragment.lastChild
    range.deleteContents()
    range.insertNode(fragment)
    if (last) setCaretAfter(last)
    commit()
    revealCaret()
  }

  function chooseItem(
    item: ContextItem,
    trigger: Trigger,
    match: TriggerMatch
  ): void {
    const editor = editorRef.current
    if (!editor) return
    const query = document.createRange()
    const caret = getCaretIn(editor)
    try {
      query.setStart(match.node, match.offset)
      if (caret) query.setEnd(caret.startContainer, caret.startOffset)
      else query.setEnd(match.node, match.offset + 1 + match.query.length)
    } catch {
      return
    }

    // Remove the typed query first so `onSelect` sees a clean caret.
    query.deleteContents()
    setCaret(query.startContainer, query.startOffset)
    publish(read())
    if (trigger.onSelect?.(item, composer) === false) return
    const target = getRangeIn(editor)
    if (target) insertToken({ trigger: trigger.char, item }, target)
  }

  function openTrigger(char: string): void {
    const editor = editorRef.current
    if (!editor || isDisabled || !triggersByChar.has(char)) return
    const range = ensureCaret()
    const before = range.cloneRange()
    before.collapse(true)
    before.setStart(editor, 0)
    const previousChar = stripSentinels(before.toString()).slice(-1)
    insertText(previousChar && !/\s/.test(previousChar) ? ` ${char}` : char)
  }

  // --- Engines ---

  const menuEngine = useTriggerMenu({
    editorRef,
    triggers,
    onChoose: chooseItem,
    onResults: (count) =>
      internals.announce(
        count === 0 ? labels.noResults : labels.results(count)
      ),
    reportError: internals.reportError,
  })

  const ghostEngine = useAutocomplete({
    editorRef,
    wrapperRef,
    options: autocomplete,
    isSingleLine: singleLine,
    isBlocked: () => isComposingRef.current || menuEngine.isOpen(),
    insertText,
    reportError: internals.reportError,
    onReady: (suggestion) =>
      internals.announce(`${suggestion}. ${labels.suggestionHint}`),
  })

  // --- Bridge for the root API ---

  const bridgeRef = useRef({ insertText, insertToken, openTrigger })
  bridgeRef.current = { insertText, insertToken, openTrigger }
  useEffect(() => {
    internals.registerEditor({
      focus: () => {
        const editor = editorRef.current
        if (!editor) return
        editor.focus({ preventScroll: true })
        if (!getRangeIn(editor)) setCaretAtEnd(editor)
      },
      insertText: (text) => bridgeRef.current.insertText(text),
      insertToken: (item, trigger) =>
        bridgeRef.current.insertToken({ trigger, item }, ensureCaret()),
      openTrigger: (char) => bridgeRef.current.openTrigger(char),
    })
    return () => internals.registerEditor(null)
  }, [internals])

  // --- Value sync: rebuild the DOM when the value changes from outside ---

  useIsomorphicLayoutEffect(() => {
    const editor = editorRef.current
    if (!editor || value === committedRef.current) return
    const current = read()
    committedRef.current = value

    if (isEqual(current, value)) {
      // Same content; refresh item data such as labels and icons.
      if (tokens.length === 0) return
      value
        .filter((segment) => segment.type === 'token')
        .forEach((segment, index) => {
          const entry = tokens[index]?.entry
          if (entry) entry.item = segment.item
        })
      setTokens((previous) => previous.map((token) => ({ ...token })))
      return
    }

    menuEngine.close()
    ghostEngine.cancel()
    selectToken(null)
    registryRef.current.clear()
    editor.textContent = ''
    editor.appendChild(writeDom(value, registryRef.current))
    syncTokens()
    if (document.activeElement === editor) setCaretAtEnd(editor)
  }, [value])

  useEffect(() => {
    if (autoFocus) composer.focus()
    // Only on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    // Keep formatting such as bold or links out of the content.
    function handleBeforeInput(event: InputEvent): void {
      if (event.inputType.startsWith('format')) event.preventDefault()
    }
    editor.addEventListener('beforeinput', handleBeforeInput)
    return () => editor.removeEventListener('beforeinput', handleBeforeInput)
  }, [])

  useEffect(() => {
    const registry = registryRef.current
    return () => registry.clear()
  }, [])

  // --- Event handlers ---

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    onKeyDown?.(event)
    if (event.defaultPrevented) return
    if (isComposingRef.current || isComposingEvent(event)) return

    const shortcutTrigger = triggers.find(
      (trigger) => trigger.shortcut && matchesShortcut(event, trigger.shortcut)
    )
    if (shortcutTrigger) {
      event.preventDefault()
      openTrigger(shortcutTrigger.char)
      return
    }

    if (menuEngine.handleKeyDown(event)) return
    if (ghostEngine.handleKeyDown(event)) return

    const editor = editorRef.current
    if (!editor) return
    const selected = selectedRef.current

    if (selected) {
      if (event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault()
        removeToken(selected)
        return
      }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault()
        selectToken(null)
        const spacer = selected.nextSibling
        if (event.key === 'ArrowLeft') {
          const parent = selected.parentNode!
          setCaret(
            parent,
            Array.prototype.indexOf.call(parent.childNodes, selected)
          )
        } else if (spacer?.nodeType === Node.TEXT_NODE) setCaret(spacer, 1)
        else setCaretAfter(selected)
        return
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        selectToken(null)
        return
      }
      selectToken(null)
    }

    const hasModifier = event.altKey || event.metaKey || event.ctrlKey
    if (event.key === 'Backspace' && !hasModifier) {
      const token = getTokenBeforeCaret(editor)
      if (token) {
        event.preventDefault()
        selectToken(token)
        return
      }
    }
    if (event.key === 'Delete' && !hasModifier) {
      const token = getTokenAfterCaret(editor)
      if (token) {
        event.preventDefault()
        selectToken(token)
        return
      }
    }

    if (event.key !== 'Enter') return
    const isMod = isModKey(event)
    const shouldSubmit =
      singleLine || isMod || (submitKey === 'enter' && !event.shiftKey)
    if (!shouldSubmit) return
    event.preventDefault()
    if (!event.repeat) composer.submit()
  }

  function handleInput(): void {
    selectToken(null)
    pendingCommitRef.current = false
    commit()
  }

  function handlePaste(event: ClipboardEvent<HTMLDivElement>): void {
    const editor = editorRef.current
    if (!editor) return
    event.preventDefault()
    selectToken(null)

    const data = event.clipboardData
    const files = Array.from(data?.files ?? [])
    const text = data?.getData('text/plain') ?? ''
    let isPrevented = false
    onPaste?.(
      {
        text,
        files,
        nativeEvent: event.nativeEvent,
        preventDefault: () => (isPrevented = true),
      },
      composer
    )
    if (isPrevented) return

    if (files.length > 0 && internals.acceptFiles !== false) {
      composer.addFiles(files, 'paste')
      if (text.length === 0) return
    }

    const rich = data?.getData(CLIPBOARD_TYPE)
    const content = rich ? parseClipboardValue(rich) : null
    if (content && !singleLine) {
      insertValue(content)
      return
    }
    insertText(normalizePastedText(text, singleLine))
  }

  function handleCopy(
    event: ClipboardEvent<HTMLDivElement>,
    isCut: boolean
  ): void {
    const editor = editorRef.current
    if (!editor) return
    const range = getRangeIn(editor)
    const selected = selectedRef.current
    const container = document.createElement('div')
    if (selected) container.append(selected.cloneNode(true))
    else if (range && !range.collapsed) container.append(range.cloneContents())
    else return

    const content = normalizeValue(readDom(container, registryRef.current))
    event.preventDefault()
    event.clipboardData.setData('text/plain', getText(content))
    event.clipboardData.setData(
      CLIPBOARD_TYPE,
      JSON.stringify(serialize(content))
    )
    if (!isCut || isDisabled) return
    if (selected) removeToken(selected)
    else if (range && !execCommand('delete')) {
      range.deleteContents()
      commit()
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>): void {
    const text = event.dataTransfer.getData('text/plain')
    if (event.dataTransfer.files.length > 0 || text.length === 0) return
    event.preventDefault()
    const doc = document as Document & {
      caretPositionFromPoint?: (
        x: number,
        y: number
      ) => { offsetNode: Node; offset: number } | null
    }
    const position = doc.caretPositionFromPoint?.(event.clientX, event.clientY)
    const range = position
      ? null
      : document.caretRangeFromPoint?.(event.clientX, event.clientY)
    editorRef.current?.focus({ preventScroll: true })
    if (position) setCaret(position.offsetNode, position.offset)
    else if (range) setCaret(range.startContainer, range.startOffset)
    insertText(normalizePastedText(text, singleLine))
  }

  function handleFocus(event: FocusEvent<HTMLDivElement>): void {
    onFocus?.(event)
    const isPointer = isPointerFocusRef.current
    isPointerFocusRef.current = false
    if (isPointer) return
    queueMicrotask(() => {
      const editor = editorRef.current
      if (editor && document.activeElement === editor && !getRangeIn(editor)) {
        setCaretAtEnd(editor)
      }
    })
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>): void {
    onBlur?.(event)
    isPointerFocusRef.current = false
    selectToken(null)
    ghostEngine.cancel()
    menuEngine.close()
  }

  function handleCompositionEnd(): void {
    isComposingRef.current = false
    commit()
  }

  // --- Render ---

  const tokenActionsRef = useRef({ select: selectToken, remove: removeToken })
  tokenActionsRef.current = { select: selectToken, remove: removeToken }
  const handleTokenSelect = useCallback((host: HTMLElement) => {
    editorRef.current?.focus({ preventScroll: true })
    tokenActionsRef.current.select(host)
  }, [])
  const handleTokenRemove = useCallback(
    (host: HTMLElement) => tokenActionsRef.current.remove(host),
    []
  )
  const themeSource = useCallback(() => wrapperRef.current, [])

  const getOptionId = useCallback(
    (index: number) => `${internals.inputId}-option-${index}`,
    [internals.inputId]
  )
  const listboxId = `${internals.inputId}-listbox`
  const openMenu = menuEngine.menu
  const menuContext: MenuContextValue = {
    menu: openMenu,
    labels,
    listboxId,
    getOptionId,
    menuElementRef: menuEngine.menuElementRef,
    themeSource,
    select: menuEngine.select,
    setActive: menuEngine.setActive,
  }
  const hasTriggers = triggers.length > 0
  const activeIndex = openMenu?.activeIndex ?? -1
  const ghost = ghostEngine.ghost

  return (
    <div
      ref={wrapperRef}
      className="inlay-field"
      data-single-line={singleLine || undefined}
    >
      <div
        id={internals.inputId}
        aria-label={placeholder}
        {...rest}
        ref={editorRef}
        className={['inlay-input', className].filter(Boolean).join(' ')}
        contentEditable={!isDisabled}
        suppressContentEditableWarning
        role="textbox"
        spellCheck
        enterKeyHint={submitKey === 'enter' || singleLine ? 'send' : 'enter'}
        aria-multiline={!singleLine}
        aria-disabled={isDisabled || undefined}
        aria-placeholder={placeholder}
        aria-autocomplete={hasTriggers ? 'list' : undefined}
        aria-haspopup={hasTriggers ? 'listbox' : undefined}
        aria-controls={openMenu ? listboxId : undefined}
        aria-activedescendant={
          openMenu && activeIndex >= 0 ? getOptionId(activeIndex) : undefined
        }
        data-placeholder={placeholder}
        data-empty={value.length === 0 || undefined}
        tabIndex={isDisabled ? -1 : 0}
        onMouseDown={() => (isPointerFocusRef.current = true)}
        onClick={() => {
          ghostEngine.cancel()
          menuEngine.close()
          selectToken(null)
        }}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        onPaste={handlePaste}
        onCopy={(event) => handleCopy(event, false)}
        onCut={(event) => handleCopy(event, true)}
        onDragStart={(event) => event.preventDefault()}
        onDrop={handleDrop}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onCompositionStart={() => {
          isComposingRef.current = true
          ghostEngine.cancel()
        }}
        onCompositionEnd={handleCompositionEnd}
      />
      {ghost && !openMenu && (
        <GhostText ghost={ghost} onAccept={ghostEngine.accept} />
      )}
      {tokens.map((token) =>
        createPortal(
          <TokenView
            item={token.entry.item}
            char={token.entry.trigger}
            trigger={
              token.entry.trigger === undefined
                ? undefined
                : triggersByChar.get(token.entry.trigger)
            }
            host={token.element}
            isSelected={token.key === selectedKey}
            removeLabel={labels.remove}
            onSelect={handleTokenSelect}
            onRemove={handleTokenRemove}
          />,
          token.element,
          token.key
        )
      )}
      <MenuContext.Provider value={menuContext}>
        {menuElement}
      </MenuContext.Provider>
    </div>
  )
}

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type HTMLAttributes,
  type MouseEvent,
} from 'react'
import { getText, isEmpty as isValueEmpty } from '../content'
import type {
  Attachment,
  ComposerErrorSource,
  ComposerMessage,
  ComposerValue,
  FileSource,
} from '../types'
import {
  ComposerContext,
  DEFAULT_LABELS,
  InternalsContext,
  type ComposerApi,
  type ComposerContextValue,
  type ComposerInternals,
  type ComposerLabels,
  type EditorBridge,
} from './context'
import {
  createAttachment,
  hasFiles,
  matchesAccept,
  revokePreview,
} from './files'
import { useControllableState } from './use-controllable-state'

const EMPTY_VALUE: ComposerValue = []
const NO_ATTACHMENTS: Array<Attachment> = []
const INTERACTIVE =
  'button, a, input, select, textarea, label, [contenteditable="true"], [role="button"], [role="option"]'

export type ComposerProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'defaultValue' | 'onSubmit' | 'onError'
> & {
  value?: ComposerValue
  defaultValue?: ComposerValue
  onValueChange?: (value: ComposerValue) => void
  attachments?: Array<Attachment>
  defaultAttachments?: Array<Attachment>
  onAttachmentsChange?: (attachments: Array<Attachment>) => void
  onSubmit?: (message: ComposerMessage) => void
  /** Clear text and attachments after submit. Default `true`. */
  clearOnSubmit?: boolean
  disabled?: boolean
  /**
   * Accept pasted and dropped files. A string limits types like
   * `<input accept>`, e.g. `"image/*,.pdf"`.
   */
  acceptFiles?: boolean | string
  /** Take over file intake, e.g. to upload. Defaults to attaching files. */
  onFiles?: (files: Array<File>, source: FileSource) => void
  onError?: (error: unknown, source: ComposerErrorSource) => void
  labels?: Partial<ComposerLabels>
}

export const Composer = forwardRef<ComposerApi, ComposerProps>(
  function Composer(
    {
      value: valueProp,
      defaultValue = EMPTY_VALUE,
      onValueChange,
      attachments: attachmentsProp,
      defaultAttachments = NO_ATTACHMENTS,
      onAttachmentsChange,
      onSubmit,
      clearOnSubmit = true,
      disabled = false,
      acceptFiles = false,
      onFiles,
      onError,
      labels: labelsProp,
      className,
      children,
      onMouseDown,
      ...rest
    },
    ref
  ) {
    const [value, setValue, valueRef] = useControllableState(
      valueProp,
      defaultValue,
      onValueChange
    )
    const [attachments, setAttachments, attachmentsRef] = useControllableState(
      attachmentsProp,
      defaultAttachments,
      onAttachmentsChange
    )
    const [isDragging, setIsDragging] = useState(false)
    const [announcement, setAnnouncement] = useState('')

    const inputId = useId()
    const editorRef = useRef<EditorBridge | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const dragDepthRef = useRef(0)
    const propsRef = useRef({ onSubmit, clearOnSubmit, onFiles, onError })
    propsRef.current = { onSubmit, clearOnSubmit, onFiles, onError }
    const disabledRef = useRef(disabled)
    disabledRef.current = disabled
    const accept = typeof acceptFiles === 'string' ? acceptFiles : undefined

    const labels = useMemo(
      () => ({ ...DEFAULT_LABELS, ...labelsProp }),
      [labelsProp]
    )

    const announce = useCallback((message: string) => {
      setAnnouncement('')
      requestAnimationFrame(() => setAnnouncement(message))
    }, [])

    const api = useMemo<ComposerApi>(() => {
      function canSubmitNow(): boolean {
        if (disabledRef.current) return false
        const pending = attachmentsRef.current
        if (pending.some((item) => item.status === 'uploading')) return false
        return !isValueEmpty(valueRef.current) || pending.length > 0
      }

      function addAttachments(next: Array<Attachment>): void {
        if (next.length === 0) return
        setAttachments((previous) => [...previous, ...next])
        announce(
          next.length === 1
            ? labels.attachmentAdded(next[0].name)
            : labels.attachmentAdded(`${next.length} files`)
        )
      }

      return {
        focus: () => editorRef.current?.focus(),
        clear: () => {
          setValue(EMPTY_VALUE)
          setAttachments(NO_ATTACHMENTS)
        },
        submit: () => {
          if (!canSubmitNow()) return
          const current = valueRef.current
          propsRef.current.onSubmit?.({
            value: current,
            text: getText(current),
            attachments: attachmentsRef.current,
          })
          if (propsRef.current.clearOnSubmit) {
            setValue(EMPTY_VALUE)
            setAttachments(NO_ATTACHMENTS)
          }
        },
        getValue: () => valueRef.current,
        getText: () => getText(valueRef.current),
        setValue: (next) => setValue(next),
        insertText: (text) => editorRef.current?.insertText(text),
        insertToken: (item, trigger) =>
          editorRef.current?.insertToken(item, trigger),
        openTrigger: (char) => editorRef.current?.openTrigger(char),
        addFiles: (files, source = 'picker') => {
          if (disabledRef.current) return
          const accepted = files.filter((file) => matchesAccept(file, accept))
          if (accepted.length === 0) return
          const { onFiles: handleFiles } = propsRef.current
          if (handleFiles) handleFiles(accepted, source)
          else addAttachments(accepted.map(createAttachment))
        },
        openFilePicker: () => fileInputRef.current?.click(),
        addAttachments,
        updateAttachment: (id, patch) =>
          setAttachments((previous) =>
            previous.map((item) =>
              item.id === id ? { ...item, ...patch } : item
            )
          ),
        removeAttachment: (id) =>
          setAttachments((previous) => {
            const removed = previous.find((item) => item.id === id)
            if (!removed) return previous
            revokePreview(removed)
            announce(labels.tokenRemoved(removed.name))
            return previous.filter((item) => item !== removed)
          }),
      }
    }, [
      accept,
      announce,
      attachmentsRef,
      labels,
      setAttachments,
      setValue,
      valueRef,
    ])

    useImperativeHandle(ref, () => api, [api])

    // Revoke previews of attachments that were never submitted.
    useEffect(() => {
      // Intentionally reads the latest attachments at unmount.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      return () => attachmentsRef.current.forEach(revokePreview)
    }, [attachmentsRef])

    const internals = useMemo<ComposerInternals>(
      () => ({
        inputId,
        labels,
        acceptFiles,
        commit: (next) => setValue(next),
        registerEditor: (bridge) => {
          editorRef.current = bridge
        },
        announce,
        reportError: (error, source) =>
          propsRef.current.onError?.(error, source),
      }),
      [acceptFiles, announce, inputId, labels, setValue]
    )

    const isEmpty = isValueEmpty(value) && attachments.length === 0
    const canSubmit =
      !disabled &&
      !isEmpty &&
      !attachments.some((item) => item.status === 'uploading')

    const context = useMemo<ComposerContextValue>(
      () => ({
        ...api,
        value,
        attachments,
        isEmpty,
        canSubmit,
        isDisabled: disabled,
        isDragging,
      }),
      [api, value, attachments, isEmpty, canSubmit, disabled, isDragging]
    )

    const canDrop = acceptFiles !== false && !disabled

    function handleDragEnter(event: DragEvent<HTMLDivElement>): void {
      if (!canDrop || !hasFiles(event.dataTransfer)) return
      event.preventDefault()
      dragDepthRef.current += 1
      setIsDragging(true)
    }

    function handleDragOver(event: DragEvent<HTMLDivElement>): void {
      if (!canDrop || !hasFiles(event.dataTransfer)) return
      event.preventDefault()
      event.dataTransfer.dropEffect = 'copy'
    }

    function handleDragLeave(event: DragEvent<HTMLDivElement>): void {
      if (!canDrop || !hasFiles(event.dataTransfer)) return
      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1)
      if (dragDepthRef.current === 0) setIsDragging(false)
    }

    function handleDrop(event: DragEvent<HTMLDivElement>): void {
      dragDepthRef.current = 0
      setIsDragging(false)
      if (!canDrop || !hasFiles(event.dataTransfer)) return
      event.preventDefault()
      api.addFiles(Array.from(event.dataTransfer.files), 'drop')
    }

    // Clicks on empty composer chrome focus the input.
    function handleMouseDown(event: MouseEvent<HTMLDivElement>): void {
      onMouseDown?.(event)
      if (event.defaultPrevented || event.button !== 0) return
      const target = event.target as HTMLElement
      if (target.closest(INTERACTIVE)) return
      event.preventDefault()
      api.focus()
    }

    return (
      <ComposerContext.Provider value={context}>
        <InternalsContext.Provider value={internals}>
          <div
            {...rest}
            className={['inlay-composer', className].filter(Boolean).join(' ')}
            data-disabled={disabled || undefined}
            data-dragging={isDragging || undefined}
            data-empty={isEmpty || undefined}
            onMouseDown={handleMouseDown}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {children}
            {isDragging && (
              <div className="inlay-drop-overlay" aria-hidden>
                {labels.dropFiles}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={accept}
              tabIndex={-1}
              hidden
              onChange={(event) => {
                const files = Array.from(event.currentTarget.files ?? [])
                event.currentTarget.value = ''
                api.addFiles(files, 'picker')
                api.focus()
              }}
            />
            <div className="inlay-sr-only" role="status" aria-live="polite">
              {announcement}
            </div>
          </div>
        </InternalsContext.Provider>
      </ComposerContext.Provider>
    )
  }
)

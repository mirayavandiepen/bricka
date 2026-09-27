import {
  forwardRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type MouseEvent,
} from 'react'
import { useComposer, useInternals } from './context'
import { ArrowUpIcon, PaperclipIcon } from './icons'

function cx(...names: Array<string | undefined>): string {
  return names.filter(Boolean).join(' ')
}

/** Keep focus (and the mobile keyboard) in the input when pressing buttons. */
function keepInputFocus(event: MouseEvent<HTMLButtonElement>): void {
  const active = document.activeElement
  if (active instanceof HTMLElement && active.isContentEditable) {
    event.preventDefault()
  }
}

/** Row of controls below the input. `ComposerSubmit` aligns to the end. */
export function ComposerFooter({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return <div {...rest} className={cx('inlay-footer', className)} />
}

export type ComposerActionProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Accessible name, also shown as a native tooltip. */
  label: string
  /** For toggles such as tools; sets `aria-pressed`. */
  isActive?: boolean
}

/** Compact icon button styled to match the composer. */
export const ComposerAction = forwardRef<
  HTMLButtonElement,
  ComposerActionProps
>(function ComposerAction(
  { label, isActive, className, disabled, type = 'button', ...rest },
  ref
) {
  const { isDisabled } = useComposer()
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      aria-pressed={isActive}
      data-active={isActive || undefined}
      disabled={disabled ?? isDisabled}
      onMouseDown={keepInputFocus}
      {...rest}
      className={cx('inlay-action', className)}
    />
  )
})

export type ComposerAttachButtonProps = Omit<ComposerActionProps, 'label'> & {
  label?: string
}

/** Opens the file picker. Files go through `onFiles` or become attachments. */
export const ComposerAttachButton = forwardRef<
  HTMLButtonElement,
  ComposerAttachButtonProps
>(function ComposerAttachButton({ label, children, onClick, ...rest }, ref) {
  const { openFilePicker } = useComposer()
  const { labels } = useInternals()
  return (
    <ComposerAction
      ref={ref}
      label={label ?? labels.attach}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) openFilePicker()
      }}
      {...rest}
    >
      {children ?? <PaperclipIcon />}
    </ComposerAction>
  )
})

export type ComposerSubmitProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label?: string
}

/** Sends the message. Disabled while empty or while uploads are pending. */
export const ComposerSubmit = forwardRef<
  HTMLButtonElement,
  ComposerSubmitProps
>(function ComposerSubmit(
  { label, children, className, disabled, onClick, ...rest },
  ref
) {
  const { canSubmit, submit } = useComposer()
  const { labels } = useInternals()
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label ?? labels.send}
      title={label ?? labels.send}
      disabled={disabled ?? !canSubmit}
      onMouseDown={keepInputFocus}
      {...rest}
      className={cx('inlay-submit', className)}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) submit()
      }}
    >
      {children ?? <ArrowUpIcon />}
    </button>
  )
})

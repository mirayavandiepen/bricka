import type { HTMLAttributes, ReactNode } from 'react'
import type { Attachment } from '../types'
import { useComposer, useInternals } from './context'
import { formatBytes } from './files'
import { CloseIcon, FileIcon } from './icons'

export type ComposerAttachmentsProps = Omit<
  HTMLAttributes<HTMLUListElement>,
  'children'
> & {
  renderAttachment?: (
    attachment: Attachment,
    helpers: { remove: () => void }
  ) => ReactNode
}

function describe(attachment: Attachment): string | undefined {
  if (attachment.status === 'error') return attachment.error ?? 'Failed'
  if (attachment.status === 'uploading') {
    const progress = attachment.progress
    return progress === undefined
      ? 'Uploading…'
      : `Uploading ${Math.round(progress * 100)}%`
  }
  if (attachment.size !== undefined) return formatBytes(attachment.size)
  return attachment.mimeType
}

function DefaultAttachment({
  attachment,
  removeLabel,
  isDisabled,
  onRemove,
}: {
  attachment: Attachment
  removeLabel: string
  isDisabled: boolean
  onRemove: () => void
}) {
  const detail = describe(attachment)
  return (
    <>
      <span className="bricka-attachment-preview" aria-hidden>
        {attachment.previewUrl ? (
          <img src={attachment.previewUrl} alt="" draggable={false} />
        ) : (
          <FileIcon />
        )}
      </span>
      <span className="bricka-attachment-body">
        <span className="bricka-attachment-name">{attachment.name}</span>
        {detail && <span className="bricka-attachment-detail">{detail}</span>}
      </span>
      <button
        type="button"
        className="bricka-attachment-remove"
        aria-label={`${removeLabel} ${attachment.name}`}
        disabled={isDisabled}
        onClick={onRemove}
      >
        <CloseIcon width={12} height={12} />
      </button>
      {attachment.status === 'uploading' && (
        <span
          className="bricka-attachment-progress"
          style={{ transform: `scaleX(${attachment.progress ?? 0})` }}
          aria-hidden
        />
      )}
    </>
  )
}

/** Attached files and resources. Renders nothing when empty. */
export function ComposerAttachments({
  renderAttachment,
  className,
  ...rest
}: ComposerAttachmentsProps) {
  const { attachments, removeAttachment, isDisabled, focus } = useComposer()
  const { labels } = useInternals()
  if (attachments.length === 0) return null

  return (
    <ul
      aria-label="Attachments"
      {...rest}
      className={['bricka-attachments', className].filter(Boolean).join(' ')}
    >
      {attachments.map((attachment) => {
        const remove = () => {
          removeAttachment(attachment.id)
          focus()
        }
        return (
          <li
            key={attachment.id}
            className="bricka-attachment"
            data-status={attachment.status}
            data-image={attachment.previewUrl ? true : undefined}
          >
            {renderAttachment ? (
              renderAttachment(attachment, { remove })
            ) : (
              <DefaultAttachment
                attachment={attachment}
                removeLabel={labels.remove}
                isDisabled={isDisabled}
                onRemove={remove}
              />
            )}
          </li>
        )
      })}
    </ul>
  )
}

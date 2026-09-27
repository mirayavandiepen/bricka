import type { Attachment } from '../types'

let nextId = 0

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `inlay-${Date.now().toString(36)}-${++nextId}`
}

/** Match a file against an `<input accept>` string. */
export function matchesAccept(file: File, accept: string | undefined): boolean {
  if (!accept || accept.trim() === '*') return true
  const name = file.name.toLowerCase()
  const mime = file.type.toLowerCase()
  return accept.split(',').some((raw) => {
    const rule = raw.trim().toLowerCase()
    if (rule.length === 0) return false
    if (rule.startsWith('.')) return name.endsWith(rule)
    if (rule.endsWith('/*')) return mime.startsWith(rule.slice(0, -1))
    return mime === rule
  })
}

/** Default attachment for a file. Images get an object-URL preview. */
export function createAttachment(file: File): Attachment {
  const isImage = file.type.startsWith('image/')
  return {
    id: createId(),
    name: file.name,
    mimeType: file.type || undefined,
    size: file.size,
    file,
    status: 'ready',
    previewUrl:
      isImage && typeof URL.createObjectURL === 'function'
        ? URL.createObjectURL(file)
        : undefined,
  }
}

export function revokePreview(attachment: Attachment): void {
  if (
    attachment.previewUrl?.startsWith('blob:') &&
    typeof URL.revokeObjectURL === 'function'
  ) {
    URL.revokeObjectURL(attachment.previewUrl)
  }
}

export function hasFiles(dataTransfer: DataTransfer | null): boolean {
  return Array.from(dataTransfer?.types ?? []).includes('Files')
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB']
  let size = bytes / 1024
  let unit = 0
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024
    unit++
  }
  return `${size < 10 ? size.toFixed(1) : Math.round(size)} ${units[unit]}`
}

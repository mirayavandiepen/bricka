import { createContext, useContext } from 'react'
import type {
  Attachment,
  ComposerApi,
  ComposerErrorSource,
  ComposerValue,
  ContextItem,
} from '../types'

export type { ComposerApi }

export type ComposerLabels = {
  send: string
  attach: string
  remove: string
  loading: string
  noResults: string
  loadFailed: string
  dropFiles: string
  suggestionHint: string
  tokenAdded: (label: string) => string
  tokenRemoved: (label: string) => string
  attachmentAdded: (name: string) => string
  results: (count: number) => string
}

export const DEFAULT_LABELS: ComposerLabels = {
  send: 'Send',
  attach: 'Attach files',
  remove: 'Remove',
  loading: 'Loading…',
  noResults: 'No results',
  loadFailed: 'Couldn’t load results',
  dropFiles: 'Drop files to attach',
  suggestionHint: 'Press Tab to accept',
  tokenAdded: (label) => `Added ${label}`,
  tokenRemoved: (label) => `Removed ${label}`,
  attachmentAdded: (name) => `Attached ${name}`,
  results: (count) =>
    count === 1 ? '1 result available' : `${count} results available`,
}

export type ComposerState = {
  value: ComposerValue
  attachments: Array<Attachment>
  isEmpty: boolean
  canSubmit: boolean
  isDisabled: boolean
  isDragging: boolean
}

export type ComposerContextValue = ComposerApi & ComposerState

/** Methods the input exposes to the root. */
export type EditorBridge = {
  focus: () => void
  insertText: (text: string) => void
  insertToken: (item: ContextItem, trigger?: string) => void
  openTrigger: (char: string) => void
}

export type ComposerInternals = {
  inputId: string
  labels: ComposerLabels
  acceptFiles: boolean | string
  commit: (value: ComposerValue) => void
  registerEditor: (bridge: EditorBridge | null) => void
  announce: (message: string) => void
  reportError: (error: unknown, source: ComposerErrorSource) => void
}

export const ComposerContext = createContext<ComposerContextValue | null>(null)
export const InternalsContext = createContext<ComposerInternals | null>(null)

/** State and actions of the nearest `<Composer>`. */
export function useComposer(): ComposerContextValue {
  const context = useContext(ComposerContext)
  if (!context) {
    throw new Error('useComposer must be used inside <Composer>.')
  }
  return context
}

export function useInternals(): ComposerInternals {
  const context = useContext(InternalsContext)
  if (!context) {
    throw new Error('Composer parts must be rendered inside <Composer>.')
  }
  return context
}

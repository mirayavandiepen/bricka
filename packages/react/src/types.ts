import type { ReactNode } from 'react'

/**
 * A structured object that can live inside a message: a file, a person,
 * a document, a tool, a command, or anything else your app knows about.
 */
export type ContextItem<TData = unknown> = {
  /** Stable identifier. Two tokens with the same trigger and id are equal. */
  id: string
  /** Display text, also used for filtering. */
  label: string
  /** Free-form kind, e.g. `file`, `person`, `tool`. Exposed as `data-type`. */
  type?: string
  /** Secondary text shown in the menu and in the token tooltip. */
  description?: string
  icon?: ReactNode
  /** Items sharing a group are rendered under one heading. */
  group?: string
  /** Extra search terms for filtering. */
  keywords?: Array<string>
  /** Plain-text form used by `getText()`. Defaults to trigger + label. */
  text?: string
  disabled?: boolean
  /** Arbitrary application data carried with the token. */
  data?: TData
}

export type TextSegment = {
  type: 'text'
  text: string
}

export type TokenSegment = {
  type: 'token'
  /** The trigger character that produced the token, e.g. `@` or `/`. */
  trigger?: string
  item: ContextItem
}

export type Segment = TextSegment | TokenSegment

/** The composer content: an ordered list of text runs and tokens. */
export type ComposerValue = Array<Segment>

// --- Triggers ---

export type TriggerQuery = {
  query: string
  signal: AbortSignal
}

export type TriggerItems =
  | Array<ContextItem>
  | ((
      request: TriggerQuery
    ) => Array<ContextItem> | Promise<Array<ContextItem>>)

export type Trigger = {
  /** Single character that opens the menu, e.g. `@`, `/`, `#`. */
  char: string
  /** Accessible name of the menu, e.g. "Mentions". */
  label?: string
  /** Static items (fuzzy-filtered for you) or a sync/async loader. */
  items: TriggerItems
  /**
   * Custom filtering. Defaults to fuzzy matching for static arrays and to
   * no filtering for loaders, which are expected to filter themselves.
   */
  filter?: (items: Array<ContextItem>, query: string) => Array<ContextItem>
  /** Milliseconds to wait before calling a loader. Default `0`. */
  debounce?: number
  /** Maximum number of rendered results. Default `50`. */
  limit?: number
  /** Fallback icon for items and tokens of this trigger. */
  icon?: ReactNode
  emptyMessage?: ReactNode
  /** Open the menu with a keyboard shortcut, e.g. `mod+k`. */
  shortcut?: string
  renderItem?: (item: ContextItem, state: { isActive: boolean }) => ReactNode
  renderToken?: (item: ContextItem) => ReactNode
  /**
   * Runs after the typed query is removed. Return `false` to skip inserting
   * a token, e.g. for commands that act instead of adding context.
   */
  onSelect?: (item: ContextItem, composer: ComposerApi) => boolean | void
}

// --- Autocomplete ---

export type AutocompleteRequest = {
  /** Plain text before the caret, trimmed to `contextLength`. */
  text: string
  value: ComposerValue
  signal: AbortSignal
}

/**
 * A single suggestion, several suggestions to cycle through, or an async
 * iterable of text chunks that are appended as they stream in.
 */
export type AutocompleteResult =
  string | Array<string> | AsyncIterable<string> | null | undefined

export type AutocompleteSource = (
  request: AutocompleteRequest
) => AutocompleteResult | Promise<AutocompleteResult>

export type AutocompleteOptions = {
  suggest: AutocompleteSource
  /** Pause in milliseconds before requesting. Default `300`. */
  delay?: number
  /** Minimum length of trimmed text before requesting. Default `1`. */
  minLength?: number
  /** Number of trailing characters sent as `text`. Default `1000`. */
  contextLength?: number
}

// --- Attachments ---

export type AttachmentStatus = 'uploading' | 'ready' | 'error'

export type Attachment<TData = unknown> = {
  id: string
  name: string
  mimeType?: string
  size?: number
  /** Image preview URL. Created automatically for image files. */
  previewUrl?: string
  file?: File
  status?: AttachmentStatus
  /** Upload progress between 0 and 1. */
  progress?: number
  error?: string
  data?: TData
}

export type FileSource = 'paste' | 'drop' | 'picker'

// --- Composer ---

export type ComposerMessage = {
  value: ComposerValue
  text: string
  attachments: Array<Attachment>
}

export type ComposerErrorSource = 'trigger' | 'autocomplete'

export type ComposerPasteEvent = {
  text: string
  files: Array<File>
  nativeEvent: ClipboardEvent
  preventDefault: () => void
}

export type SubmitKey = 'enter' | 'mod+enter'

/** Imperative API, available from `useComposer()` and the Composer ref. */
export type ComposerApi = {
  focus: () => void
  clear: () => void
  submit: () => void
  getValue: () => ComposerValue
  getText: () => string
  setValue: (value: ComposerValue) => void
  insertText: (text: string) => void
  insertToken: (item: ContextItem, trigger?: string) => void
  /** Type a trigger character at the caret and open its menu. */
  openTrigger: (char: string) => void
  /** Run files through `onFiles`, or attach them directly. */
  addFiles: (files: Array<File>, source?: FileSource) => void
  openFilePicker: () => void
  addAttachments: (attachments: Array<Attachment>) => void
  updateAttachment: (id: string, patch: Partial<Attachment>) => void
  removeAttachment: (id: string) => void
}

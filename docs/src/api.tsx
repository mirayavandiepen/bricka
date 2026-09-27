import { Section } from './section'

type Row = [name: string, type: string, description: string]

const TABLES: Array<{
  id: string
  title: string
  note?: string
  rows: Array<Row>
}> = [
  {
    id: 'api-composer',
    title: 'Composer',
    note: 'Also accepts div attributes. The ref exposes ComposerApi.',
    rows: [
      [
        'value / defaultValue',
        'ComposerValue',
        'Controlled or initial content.',
      ],
      ['onValueChange', '(value) => void', 'Called when the content changes.'],
      [
        'onSubmit',
        '(message: ComposerMessage) => void',
        'Receives { text, value, attachments }.',
      ],
      [
        'clearOnSubmit',
        'boolean = true',
        'Clear text and attachments after submit.',
      ],
      [
        'disabled',
        'boolean',
        'Makes the input read-only and disables controls.',
      ],
      [
        'acceptFiles',
        'boolean | string',
        'Accept pasted and dropped files. A string filters like <input accept>.',
      ],
      [
        'onFiles',
        '(files, source) => void',
        'Take over file intake, e.g. to upload.',
      ],
      [
        'attachments / defaultAttachments',
        'Attachment[]',
        'Controlled or initial attachments.',
      ],
      [
        'onAttachmentsChange',
        '(attachments) => void',
        'Called when attachments change.',
      ],
      [
        'onError',
        '(error, source) => void',
        'Trigger or autocomplete failures.',
      ],
      [
        'labels',
        'Partial<ComposerLabels>',
        'Replace built-in text for localization.',
      ],
    ],
  },
  {
    id: 'api-input',
    title: 'ComposerInput',
    note: 'Also accepts div attributes such as aria-label and className.',
    rows: [
      [
        'placeholder',
        'string',
        'Shown while empty; also the fallback accessible name.',
      ],
      ['triggers', 'Trigger[]', 'Characters that open suggestion menus.'],
      [
        'autocomplete',
        'AutocompleteSource | AutocompleteOptions',
        'Ghost-text suggestions.',
      ],
      [
        'submitKey',
        "'enter' | 'mod+enter' = 'enter'",
        'Which key sends the message.',
      ],
      [
        'singleLine',
        'boolean',
        'One line that scrolls horizontally, like a search field.',
      ],
      ['autoFocus', 'boolean', 'Focus on mount.'],
      [
        'onPaste',
        '(event, composer) => void',
        'Inspect or replace paste handling.',
      ],
      [
        'menu',
        'ReactNode = <ComposerMenu />',
        'Suggestion popup. Pass your own built on useComposerMenu().',
      ],
    ],
  },
  {
    id: 'api-trigger',
    title: 'Trigger',
    rows: [
      ['char', 'string', 'The character that opens the menu.'],
      [
        'items',
        'ContextItem[] | (query) => items | Promise',
        'Static items or a loader with { query, signal }.',
      ],
      ['label', 'string', 'Accessible name of the menu.'],
      [
        'filter',
        '(items, query) => items',
        'Custom filtering. Defaults to fuzzy for arrays.',
      ],
      ['debounce', 'number = 0', 'Delay before calling a loader.'],
      ['limit', 'number = 50', 'Maximum rendered results.'],
      ['icon', 'ReactNode', 'Fallback icon for items and tokens.'],
      ['emptyMessage', 'ReactNode', 'Shown when nothing matches.'],
      ['shortcut', 'string', "Opens the menu, e.g. 'mod+k'."],
      [
        'renderItem / renderToken',
        '(item) => ReactNode',
        'Custom menu rows and tokens.',
      ],
      [
        'onSelect',
        '(item, composer) => boolean | void',
        'Return false to act instead of inserting a token.',
      ],
    ],
  },
  {
    id: 'api-autocomplete',
    title: 'AutocompleteOptions',
    rows: [
      [
        'suggest',
        '({ text, value, signal }) => result',
        'Return a string, strings, an async iterable, or null.',
      ],
      ['delay', 'number = 300', 'Pause before requesting.'],
      ['minLength', 'number = 1', 'Minimum trimmed text length.'],
      ['contextLength', 'number = 1000', 'Trailing characters sent as text.'],
    ],
  },
  {
    id: 'api-parts',
    title: 'Other parts',
    rows: [
      [
        'ComposerFooter',
        'div',
        'Row of controls. ComposerSubmit aligns to the end.',
      ],
      [
        'ComposerAction',
        'button + label, isActive',
        'Icon button; isActive sets aria-pressed.',
      ],
      ['ComposerAttachButton', 'button', 'Opens the file picker.'],
      ['ComposerSubmit', 'button', 'Sends; disabled while empty or uploading.'],
      [
        'ComposerAttachments',
        'ul + renderAttachment',
        'Attachment list with previews and progress.',
      ],
      ['ComposerMenu', 'className, style', 'The default suggestion popup.'],
    ],
  },
  {
    id: 'api-hooks',
    title: 'Hooks and helpers',
    rows: [
      [
        'useComposer()',
        'ComposerApi & state',
        'value, attachments, isEmpty, canSubmit, isDragging and every action.',
      ],
      [
        'useComposerMenu()',
        'MenuContextValue',
        'Menu state and select/setActive for a custom popup.',
      ],
      [
        'getText(value, options?)',
        'string',
        'Plain text; tokens become trigger + label or item.text.',
      ],
      ['getTokens(value, trigger?)', 'ContextItem[]', 'Referenced items.'],
      [
        'serialize(value)',
        'SerializedSegment[]',
        'JSON-safe value without icons.',
      ],
      ['isEmpty(value) / isEqual(a, b)', 'boolean', 'Content checks.'],
      [
        'fuzzyFilter(items, query)',
        'ContextItem[]',
        'The built-in ranking, for your own loaders.',
      ],
    ],
  },
  {
    id: 'api-methods',
    title: 'ComposerApi',
    rows: [
      ['focus / clear / submit', '() => void', ''],
      ['getValue / getText', '() => ComposerValue | string', ''],
      ['setValue', '(value) => void', 'Replace the content.'],
      [
        'insertText',
        '(text) => void',
        'Insert at the caret, keeping native undo.',
      ],
      [
        'insertToken',
        '(item, trigger?) => void',
        'Insert a token at the caret.',
      ],
      [
        'openTrigger',
        '(char) => void',
        'Type a trigger character and open its menu.',
      ],
      [
        'addFiles',
        '(files, source?) => void',
        'Run files through onFiles or attach them.',
      ],
      [
        'addAttachments / updateAttachment / removeAttachment',
        '…',
        'Manage attachments.',
      ],
      ['openFilePicker', '() => void', ''],
    ],
  },
]

export function ApiReference() {
  return (
    <Section id="api" title="API reference">
      {TABLES.map((table) => (
        <div key={table.id} className="api-table">
          <h3 id={table.id}>{table.title}</h3>
          {table.note && <p className="api-note">{table.note}</p>}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {table.rows.map(([name, type, description]) => (
                  <tr key={name}>
                    <td>
                      <code>{name}</code>
                    </td>
                    <td>
                      <code className="type">{type}</code>
                    </td>
                    <td>{description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </Section>
  )
}

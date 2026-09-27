import { AgentComposer } from '@examples/agent-composer'
import { CodingAssistant } from '@examples/coding-assistant'
import { MessagePreview } from '@examples/parts'
import { WritingAssistant } from '@examples/writing-assistant'
import type { ComposerMessage } from '@inlay/react'
import { useState, type ReactNode } from 'react'
import { ApiReference } from './api'
import { Code, CopyButton } from './code'
import { Section } from './section'

function Install() {
  const command = 'npm install @inlay/react'
  return (
    <Section id="installation" title="Installation">
      <div className="install">
        <code>
          <span aria-hidden>$ </span>
          {command}
        </code>
        <CopyButton text={command} label="Copy install command" />
      </div>
      <p>
        React 18 or newer is required. There are no other runtime dependencies.
        Import the stylesheet once, or skip it and style the parts yourself.
      </p>
      <Code language="ts">{`import '@inlay/react/styles.css'`}</Code>
    </Section>
  )
}

function QuickStart() {
  return (
    <Section id="quick-start" title="Quick start">
      <p>
        A composer is a root with parts inside it. Give the input a trigger and
        people can pull context into their message with <kbd>@</kbd>.
      </p>
      <Code title="chat.tsx">{`
import { Composer, ComposerFooter, ComposerInput, ComposerSubmit } from '@inlay/react'
import '@inlay/react/styles.css'

const mentions = {
  char: '@',
  items: [
    { id: 'readme', label: 'README.md', type: 'file' },
    { id: 'ana', label: 'Ana Ruiz', type: 'person' },
  ],
}

export function Chat() {
  return (
    <Composer onSubmit={({ text, value }) => send(text, value)}>
      <ComposerInput placeholder="Ask anything" triggers={[mentions]} />
      <ComposerFooter>
        <ComposerSubmit />
      </ComposerFooter>
    </Composer>
  )
}`}</Code>
      <p>
        State is handled for you. <code>onSubmit</code> receives the plain text,
        the structured value and any attachments, and the composer clears itself
        afterwards.
      </p>
    </Section>
  )
}

function ComposerDocs() {
  return (
    <Section id="composer" title="Composer">
      <p>
        <code>Composer</code> owns the message: its value, attachments and
        submission. The parts inside it decide what the composer looks like. Use
        only the ones you need, in any order.
      </p>
      <Code>{`
<Composer onSubmit={send} acceptFiles>
  <ComposerAttachments />              {/* files above the input */}
  <ComposerInput triggers={[mentions, commands]} autocomplete={suggest} />
  <ComposerFooter>
    <ComposerAttachButton />
    <ComposerAction label="Web search" isActive={web} onClick={toggleWeb}>
      <GlobeIcon />
    </ComposerAction>
    <ModelPicker />                      {/* any element you like */}
    <ComposerSubmit />
  </ComposerFooter>
</Composer>`}</Code>
      <h3>The value</h3>
      <p>
        Content is a list of text runs and tokens. Tokens keep the full item, so
        your app knows exactly what was referenced.
      </p>
      <Code language="ts">{`
[
  { type: 'text', text: 'Fix ' },
  { type: 'token', trigger: '@', item: { id: 'src/Composer.tsx', label: 'Composer.tsx', type: 'file' } },
  { type: 'text', text: ' and check ' },
  { type: 'token', trigger: '/', item: { id: 'a11y', label: 'accessibility' } },
]`}</Code>
      <p>Convert it with the helpers, or read it from the submitted message:</p>
      <Code language="ts">{`
import { getText, getTokens, serialize } from '@inlay/react'

getText(value)       // 'Fix @Composer.tsx and check /accessibility'
getTokens(value, '@') // [{ id: 'src/Composer.tsx', ... }]
serialize(value)     // JSON-safe, icons removed
getText(value, { formatToken: (t) => \`<\${t.item.type}:\${t.item.id}>\` })`}</Code>
      <h3>Controlled or not</h3>
      <p>
        Leave the value alone and the composer manages it. Pass{' '}
        <code>value</code> and <code>onValueChange</code> to own it, for example
        to persist drafts.
      </p>
      <Code>{`
const [draft, setDraft] = useState<ComposerValue>(loadDraft)

<Composer value={draft} onValueChange={setDraft} clearOnSubmit={false}>…</Composer>`}</Code>
      <h3>Reaching in</h3>
      <p>
        Parts and your own components can read state and call actions through{' '}
        <code>useComposer()</code>. The same API is available on a ref.
      </p>
      <Code>{`
function CharacterCount() {
  const { value, canSubmit } = useComposer()
  return <span>{getText(value).length}</span>
}

const composer = useRef<ComposerApi>(null)
composer.current?.insertToken({ id: 'main', label: 'main', type: 'branch' }, '@')`}</Code>
    </Section>
  )
}

function ContextDocs() {
  return (
    <Section id="context" title="Context and mentions">
      <p>
        A <code>ContextItem</code> is anything your app can point at: a file, a
        person, a document, a URL, a database row, an agent. Only{' '}
        <code>id</code> and <code>label</code> are required.
      </p>
      <Code language="ts">{`
const item: ContextItem = {
  id: 'issue-128',
  label: '#128 Menu flickers in Safari',
  type: 'issue',               // exposed as data-type for styling
  description: 'Open',         // shown in the menu and the token tooltip
  icon: <IssueIcon />,
  group: 'Issues',             // menu section
  keywords: ['bug', 'github'], // extra search terms
  data: { url: 'https://…' },  // your own payload
}`}</Code>
      <h3>Loading items</h3>
      <p>
        Static arrays are fuzzy-filtered for you. For larger or remote sources,
        pass a function. It receives an <code>AbortSignal</code> that fires when
        the query changes, and results that arrive late are ignored.
      </p>
      <Code language="ts">{`
const mentions: Trigger = {
  char: '@',
  label: 'Files',
  debounce: 120,
  items: async ({ query, signal }) => {
    const response = await fetch(\`/api/files?q=\${query}\`, { signal })
    return response.json()
  },
}`}</Code>
      <p>
        While results load, the previous ones stay visible so the menu does not
        jump. Failures show a short notice and reach <code>onError</code>;
        typing is never interrupted.
      </p>
      <h3>Custom rendering</h3>
      <Code>{`
const people: Trigger = {
  char: '@',
  items: team,
  renderItem: (person, { isActive }) => <PersonRow person={person} isActive={isActive} />,
  renderToken: (person) => <Avatar src={person.data.avatar} name={person.label} />,
}`}</Code>
    </Section>
  )
}

function CommandsDocs() {
  return (
    <Section id="commands" title="Commands">
      <p>
        Commands are just another trigger. They share the menu, filtering,
        keyboard handling and accessibility with mentions, so any character can
        become a menu: <code>/</code> for commands, <code>#</code> for channels,{' '}
        <code>:</code> for emoji.
      </p>
      <Code language="ts">{`
const commands: Trigger = {
  char: '/',
  label: 'Commands',
  shortcut: 'mod+k',
  items: [
    { id: 'summarize', label: 'summarize', description: 'Summarize the thread', icon: <ListIcon /> },
    { id: 'rewrite', label: 'rewrite', description: 'Rewrite the selection', icon: <PenIcon /> },
    { id: 'clear', label: 'clear', description: 'Clear the composer' },
  ],
  onSelect: (command, composer) => {
    if (command.id !== 'clear') return // insert as a token
    composer.clear()
    return false                       // act instead of inserting
  },
}`}</Code>
      <p>
        By default a chosen command becomes a token, and your app decides what
        it means when the message is sent. Return <code>false</code> from{' '}
        <code>onSelect</code> to run an action instead. The typed query is
        removed before <code>onSelect</code> runs, so you can safely insert text
        or change the value.
      </p>
      <p>
        To open a menu from a button, call <code>openTrigger('/')</code>. It
        types the character at the caret, exactly as if the person had.
      </p>
    </Section>
  )
}

function AutocompleteDocs() {
  return (
    <Section id="autocomplete" title="AI autocomplete">
      <p>
        After a short pause, <code>suggest</code> is called with the text before
        the caret. Whatever it returns appears as ghost text. <kbd>Tab</kbd>{' '}
        accepts, <kbd>Shift</kbd> <kbd>Tab</kbd> cycles through alternatives,{' '}
        <kbd>Esc</kbd> dismisses, and tapping the suggestion accepts it on touch
        screens.
      </p>
      <Code language="ts">{`
<ComposerInput
  autocomplete={{
    delay: 300,
    suggest: async ({ text, signal }) => {
      const response = await fetch('/api/complete', {
        method: 'POST',
        body: JSON.stringify({ text }),
        signal,
      })
      const { suggestions } = await response.json()
      return suggestions // string | string[] | null
    },
  }}
/>`}</Code>
      <h3>Streaming</h3>
      <p>
        Return an async iterable to stream the suggestion as it is generated.
        Each chunk is appended. No SDK is required; any provider that streams
        text works.
      </p>
      <Code language="ts">{`
suggest: async function* ({ text, signal }) {
  const response = await fetch('/api/complete', { method: 'POST', body: text, signal })
  const reader = response.body!.pipeThrough(new TextDecoderStream()).getReader()
  while (true) {
    const { value, done } = await reader.read()
    if (done) return
    yield value
  }
}`}</Code>
      <h3>Never stale</h3>
      <p>
        Typing, moving the caret, opening a menu, composing with an IME,
        blurring and unmounting all abort the request through its signal. A
        result is only shown if the text is still exactly what it was requested
        for, so a slow response can never insert outdated content. Errors clear
        the suggestion quietly and are passed to <code>onError</code>.
      </p>
    </Section>
  )
}

function AttachmentsDocs() {
  return (
    <Section id="attachments" title="Attachments">
      <p>
        With <code>acceptFiles</code>, files can be pasted, dropped onto the
        composer, or picked with <code>ComposerAttachButton</code>. By default
        they appear as attachments, with image previews, and are included in the
        submitted message. Inlay never uploads anything.
      </p>
      <Code>{`
<Composer acceptFiles="image/*,.pdf" onSubmit={({ text, attachments }) => send(text, attachments)}>
  <ComposerAttachments />
  <ComposerInput />
  <ComposerFooter>
    <ComposerAttachButton />
    <ComposerSubmit />
  </ComposerFooter>
</Composer>`}</Code>
      <h3>Uploading</h3>
      <p>
        Handle <code>onFiles</code> to upload as soon as files arrive. Uploading
        attachments show progress and block submission until they finish.
      </p>
      <Code>{`
const composer = useRef<ComposerApi>(null)

function handleFiles(files: File[]) {
  for (const file of files) {
    const id = crypto.randomUUID()
    composer.current?.addAttachments([{ id, name: file.name, size: file.size, status: 'uploading' }])
    upload(file, { onProgress: (progress) => composer.current?.updateAttachment(id, { progress }) })
      .then((url) => composer.current?.updateAttachment(id, { status: 'ready', data: { url } }))
      .catch(() => composer.current?.updateAttachment(id, { status: 'error', error: 'Upload failed' }))
  }
}

<Composer ref={composer} acceptFiles onFiles={handleFiles}>…</Composer>`}</Code>
      <h3>Paste</h3>
      <p>
        Pasted content is always inserted as plain text, so formatting from
        other apps never leaks in. Line breaks are kept, or flattened in
        single-line inputs. Copying from one composer to another keeps tokens
        intact. Use <code>onPaste</code> to change the behavior, for example to
        turn links into tokens:
      </p>
      <Code>{`
<ComposerInput
  onPaste={(event, composer) => {
    if (!URL.canParse(event.text)) return
    event.preventDefault()
    const url = new URL(event.text)
    composer.insertToken({ id: url.href, label: url.hostname, type: 'url', text: url.href })
  }}
/>`}</Code>
    </Section>
  )
}

const THEME_TOKENS: Array<[string, string]> = [
  ['--inlay-bg / --inlay-fg', 'Surface and text'],
  [
    '--inlay-muted / --inlay-faint',
    'Secondary text, placeholder and ghost text',
  ],
  ['--inlay-border / --inlay-border-strong', 'Resting and focused borders'],
  ['--inlay-hover / --inlay-selected', 'Hover and active backgrounds'],
  ['--inlay-accent', 'Focus rings, active tools and progress'],
  ['--inlay-token-bg / --inlay-token-fg', 'Inline tokens'],
  ['--inlay-token-selected', 'A token selected with Backspace or a click'],
  ['--inlay-popover-bg / --inlay-popover-shadow', 'Menu and tooltip surfaces'],
  ['--inlay-radius / --inlay-radius-sm', 'Composer and menu corners'],
  ['--inlay-font / --inlay-font-mono / --inlay-font-size', 'Typography'],
  ['--inlay-max-height', 'Height before the input scrolls'],
]

function StylingDocs() {
  return (
    <Section id="styling" title="Styling">
      <p>
        The default theme is a set of CSS custom properties with light and dark
        values. Dark mode follows the system, or a <code>.dark</code> class or{' '}
        <code>data-theme="dark"</code> attribute on any ancestor.
      </p>
      <Code language="css">{`
:root {
  --inlay-accent: #0f766e;
  --inlay-token-bg: rgb(15 118 110 / 0.1);
  --inlay-token-fg: #0f766e;
  --inlay-radius: 8px;
}`}</Code>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Property</th>
              <th>Controls</th>
            </tr>
          </thead>
          <tbody>
            {THEME_TOKENS.map(([name, description]) => (
              <tr key={name}>
                <td>
                  <code>{name}</code>
                </td>
                <td>{description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        Every part accepts <code>className</code> and exposes its state as data
        attributes, so Tailwind or plain CSS can target it. Tokens carry{' '}
        <code>data-trigger</code> and <code>data-type</code>:
      </p>
      <Code language="css">{`
.inlay-token[data-type='person'] { border-radius: 999px; }
.inlay-token[data-selected] { outline: 1px solid var(--inlay-accent); }
.inlay-option[data-active] { background: var(--brand-50); }
.inlay-composer[data-dragging] { border-style: dashed; }`}</Code>
      <p>
        Skip the stylesheet entirely for a headless start: the parts render
        semantic markup with stable class names, and{' '}
        <code>useComposerMenu()</code> lets you replace the suggestion popup
        through <code>{'<ComposerInput menu={<MyMenu />} />'}</code>.
      </p>
    </Section>
  )
}

function AccessibilityDocs() {
  return (
    <Section id="accessibility" title="Accessibility">
      <ul className="list">
        <li>
          The input is a <code>textbox</code> with <code>aria-multiline</code>,
          an accessible name and <code>aria-placeholder</code>.
        </li>
        <li>
          Menus follow the listbox pattern: focus stays in the input while{' '}
          <code>aria-activedescendant</code> points at the active option, and
          groups are labelled.
        </li>
        <li>
          A polite live region announces result counts, inserted and removed
          tokens, attachments, and new suggestions with how to accept them.
        </li>
        <li>
          <kbd>Tab</kbd> is only captured while a suggestion is visible, so
          keyboard users can always move on. <kbd>Esc</kbd> closes the innermost
          layer and stops there.
        </li>
        <li>
          Composition events are respected: nothing opens, submits or
          autocompletes while an IME is composing.
        </li>
        <li>
          Motion is reduced under <code>prefers-reduced-motion</code>, and
          forced-colors mode keeps tokens and the active option visible.
        </li>
        <li>
          Touch targets grow on coarse pointers, and inputs use 16px text so iOS
          does not zoom.
        </li>
      </ul>
    </Section>
  )
}

const SHORTCUTS: Array<[ReactNode, string]> = [
  [
    <>
      <kbd>Enter</kbd>
    </>,
    'Send, or choose the active menu item',
  ],
  [
    <>
      <kbd>Shift</kbd> <kbd>Enter</kbd>
    </>,
    'New line',
  ],
  [
    <>
      <kbd>⌘/Ctrl</kbd> <kbd>Enter</kbd>
    </>,
    'Send (the only way when submitKey is mod+enter)',
  ],
  [
    <>
      <kbd>↑</kbd> <kbd>↓</kbd>
    </>,
    'Move through menu items (also Ctrl N / Ctrl P)',
  ],
  [
    <>
      <kbd>Tab</kbd>
    </>,
    'Choose the menu item, or accept the suggestion',
  ],
  [
    <>
      <kbd>Shift</kbd> <kbd>Tab</kbd>
    </>,
    'Next suggestion when there are several',
  ],
  [
    <>
      <kbd>Esc</kbd>
    </>,
    'Close the menu, dismiss the suggestion, or deselect a token',
  ],
  [
    <>
      <kbd>⌫</kbd>
    </>,
    'Select the token before the caret; press again to remove it',
  ],
  [
    <>
      <kbd>Del</kbd>
    </>,
    'Select the token after the caret; press again to remove it',
  ],
  [
    <>
      <kbd>←</kbd> <kbd>→</kbd>
    </>,
    'Step off a selected token',
  ],
  [
    <>
      Trigger <code>shortcut</code>
    </>,
    'Open that menu, e.g. mod+k',
  ],
]

function KeyboardDocs() {
  return (
    <Section id="keyboard" title="Keyboard">
      <div className="table-wrap">
        <table>
          <tbody>
            {SHORTCUTS.map(([keys, action], index) => (
              <tr key={index}>
                <td className="keys">{keys}</td>
                <td>{action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        Inlay does not claim shortcuts on its own. Formatting shortcuts such as
        bold are blocked, because the content is plain text with tokens.
      </p>
    </Section>
  )
}

const EXAMPLES = [
  {
    id: 'coding',
    title: 'Coding assistant',
    description:
      'Files, folders, issues and tools as async context. Commands, attachments, a tool toggle and a model picker.',
    render: (onSend: (message: ComposerMessage) => void) => (
      <CodingAssistant onSend={onSend} />
    ),
  },
  {
    id: 'writing',
    title: 'Writing assistant',
    description:
      'Documents, people, articles and sources. Suggestions stream in word by word. ⌘↵ sends.',
    render: (onSend: (message: ComposerMessage) => void) => (
      <WritingAssistant onSend={onSend} />
    ),
  },
  {
    id: 'agent',
    title: 'Agent composer',
    description:
      'Three triggers: @ agents, # resources from a slow search (type “error” to see failures), and / tools. /clear is an action.',
    render: (onSend: (message: ComposerMessage) => void) => (
      <AgentComposer onSend={onSend} />
    ),
  },
]

function Examples() {
  const [active, setActive] = useState(EXAMPLES[0].id)
  const [messages, setMessages] = useState<Record<string, ComposerMessage>>({})
  const example = EXAMPLES.find((entry) => entry.id === active)!

  return (
    <Section id="examples" title="Examples">
      <div className="tabs" role="tablist" aria-label="Examples">
        {EXAMPLES.map((entry) => (
          <button
            key={entry.id}
            id={`example-tab-${entry.id}`}
            role="tab"
            aria-selected={entry.id === active}
            aria-controls="example-panel"
            onClick={() => setActive(entry.id)}
          >
            {entry.title}
          </button>
        ))}
      </div>
      <div
        id="example-panel"
        role="tabpanel"
        aria-labelledby={`example-tab-${example.id}`}
        className="example-panel"
      >
        <p>{example.description}</p>
        <div className="example" key={example.id}>
          {example.render((message) =>
            setMessages((previous) => ({ ...previous, [example.id]: message }))
          )}
          <MessagePreview message={messages[example.id] ?? null} />
        </div>
      </div>
      <p>
        The source for all three lives in <code>examples/src</code>.
      </p>
    </Section>
  )
}

export function Sections() {
  return (
    <>
      <Install />
      <QuickStart />
      <ComposerDocs />
      <ContextDocs />
      <CommandsDocs />
      <AutocompleteDocs />
      <AttachmentsDocs />
      <StylingDocs />
      <AccessibilityDocs />
      <KeyboardDocs />
      <ApiReference />
      <Examples />
    </>
  )
}

export const NAV = [
  { id: 'introduction', label: 'Introduction' },
  { id: 'installation', label: 'Installation' },
  { id: 'quick-start', label: 'Quick start' },
  { id: 'composer', label: 'Composer' },
  { id: 'context', label: 'Context and mentions' },
  { id: 'commands', label: 'Commands' },
  { id: 'autocomplete', label: 'AI autocomplete' },
  { id: 'attachments', label: 'Attachments' },
  { id: 'styling', label: 'Styling' },
  { id: 'accessibility', label: 'Accessibility' },
  { id: 'keyboard', label: 'Keyboard' },
  { id: 'api', label: 'API reference' },
  { id: 'examples', label: 'Examples' },
]

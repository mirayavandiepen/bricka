import { AgentComposer } from '@examples/agent-composer'
import { CodingAssistant } from '@examples/coding-assistant'
import { MessagePreview } from '@examples/parts'
import { WritingAssistant } from '@examples/writing-assistant'
import type { ComposerMessage } from '@bricka/react'
import { useState, type ReactNode } from 'react'
import { ApiReference } from './api'
import { Code, CopyButton } from './code'
import { Section } from './section'
import { Facts, KeyGrid, Note, Steps, Topics } from './ui'

function GetStarted() {
  const command = 'npm install @bricka/react'
  return (
    <Section
      id="get-started"
      title="Get started"
      lede="Three steps. Works with React 18 and up, with no other dependencies."
    >
      <Steps
        items={[
          {
            title: 'Install the package',
            content: (
              <div className="install">
                <code>
                  <span aria-hidden>$ </span>
                  {command}
                </code>
                <CopyButton text={command} label="Copy install command" />
              </div>
            ),
          },
          {
            title: 'Add a composer',
            content: (
              <>
                <p>
                  A trigger is a character plus a list of things to pick from.
                  Here, typing <kbd>@</kbd> lists files and people.
                </p>
                <Code title="chat.tsx">{`
import { Composer, ComposerFooter, ComposerInput, ComposerSubmit } from '@bricka/react'
import '@bricka/react/styles.css'

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
              </>
            ),
          },
          {
            title: 'Send the message',
            content: (
              <p>
                <code>onSubmit</code> gets the plain text, the structured value
                and any attachments. The composer clears itself afterwards.
              </p>
            ),
          },
        ]}
      />
    </Section>
  )
}

function ComposerDocs() {
  return (
    <Section
      id="composer"
      title="Composer"
      lede={
        <>
          <code>Composer</code> owns the message. The parts inside decide how it
          looks. Use only the ones you need, in any order.
        </>
      }
    >
      <Topics
        label="Composer topics"
        items={[
          {
            id: 'anatomy',
            label: 'Anatomy',
            content: (
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
            ),
          },
          {
            id: 'value',
            label: 'The value',
            content: (
              <>
                <p>
                  Text runs and tokens. Tokens keep the full item, so you know
                  exactly what was referenced.
                </p>
                <Code language="ts">{`
[
  { type: 'text', text: 'Fix ' },
  { type: 'token', trigger: '@', item: { id: 'src/Composer.tsx', label: 'Composer.tsx', type: 'file' } },
  { type: 'text', text: ' and check ' },
  { type: 'token', trigger: '/', item: { id: 'a11y', label: 'accessibility' } },
]`}</Code>
                <Code language="ts" title="helpers">{`
import { getText, getTokens, serialize } from '@bricka/react'

getText(value)       // 'Fix @Composer.tsx and check /accessibility'
getTokens(value, '@') // [{ id: 'src/Composer.tsx', ... }]
serialize(value)     // JSON-safe, icons removed
getText(value, { formatToken: (t) => \`<\${t.item.type}:\${t.item.id}>\` })`}</Code>
              </>
            ),
          },
          {
            id: 'controlled',
            label: 'Controlled',
            content: (
              <>
                <p>
                  Leave it alone and the composer manages the value. Pass{' '}
                  <code>value</code> and <code>onValueChange</code> to own it,
                  for example to save drafts.
                </p>
                <Code>{`
const [draft, setDraft] = useState<ComposerValue>(loadDraft)

<Composer value={draft} onValueChange={setDraft} clearOnSubmit={false}>…</Composer>`}</Code>
              </>
            ),
          },
          {
            id: 'reaching-in',
            label: 'Reaching in',
            content: (
              <>
                <p>
                  Read state and call actions with <code>useComposer()</code>,
                  or through a ref.
                </p>
                <Code>{`
function CharacterCount() {
  const { value, canSubmit } = useComposer()
  return <span>{getText(value).length}</span>
}

const composer = useRef<ComposerApi>(null)
composer.current?.insertToken({ id: 'main', label: 'main', type: 'branch' }, '@')`}</Code>
              </>
            ),
          },
        ]}
      />
    </Section>
  )
}

function ContextDocs() {
  return (
    <Section
      id="context"
      title="Mentions"
      lede={
        <>
          A <code>ContextItem</code> is anything your app can point at: a file,
          a person, a URL, an agent. Only <code>id</code> and <code>label</code>{' '}
          are required.
        </>
      }
    >
      <Topics
        label="Context topics"
        items={[
          {
            id: 'item',
            label: 'The item',
            content: (
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
            ),
          },
          {
            id: 'loading',
            label: 'Loading items',
            content: (
              <>
                <p>
                  Arrays are fuzzy-filtered for you. For remote sources, pass a
                  function.
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
                <Facts
                  items={[
                    {
                      title: 'Late results ignored',
                      children: (
                        <>
                          The <code>signal</code> aborts when the query changes.
                        </>
                      ),
                    },
                    {
                      title: 'No jumping',
                      children: 'Old results stay while new ones load.',
                    },
                    {
                      title: 'Calm failures',
                      children: (
                        <>
                          A short notice, plus <code>onError</code>. Typing
                          continues.
                        </>
                      ),
                    },
                  ]}
                />
              </>
            ),
          },
          {
            id: 'rendering',
            label: 'Custom rendering',
            content: (
              <Code>{`
const people: Trigger = {
  char: '@',
  items: team,
  renderItem: (person, { isActive }) => <PersonRow person={person} isActive={isActive} />,
  renderToken: (person) => <Avatar src={person.data.avatar} name={person.label} />,
}`}</Code>
            ),
          },
        ]}
      />
    </Section>
  )
}

function CommandsDocs() {
  return (
    <Section
      id="commands"
      title="Commands"
      lede={
        <>
          Commands are just another trigger. Any character can open a menu:{' '}
          <kbd>/</kbd> commands, <kbd>#</kbd> channels, <kbd>:</kbd> emoji.
        </>
      }
    >
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
      <Facts
        items={[
          {
            title: 'Token by default',
            children: 'Your app decides what it means on send.',
          },
          {
            title: 'Or run an action',
            children: (
              <>
                Return <code>false</code> from <code>onSelect</code>. The typed
                query is already gone.
              </>
            ),
          },
          {
            title: 'Open from a button',
            children: (
              <>
                <code>openTrigger('/')</code> types it at the caret.
              </>
            ),
          },
        ]}
      />
    </Section>
  )
}

function AutocompleteDocs() {
  return (
    <Section
      id="autocomplete"
      title="AI autocomplete"
      lede={
        <>
          Pause typing and <code>suggest</code> gets the text before the caret.
          What it returns shows up as ghost text.
        </>
      }
    >
      <KeyGrid
        items={[
          { keys: <kbd>Tab</kbd>, action: 'Accept' },
          {
            keys: (
              <>
                <kbd>Shift</kbd> <kbd>Tab</kbd>
              </>
            ),
            action: 'Next alternative',
          },
          { keys: <kbd>Esc</kbd>, action: 'Dismiss' },
          { keys: <kbd>Tap</kbd>, action: 'Accept on touch' },
        ]}
      />
      <Topics
        label="Autocomplete topics"
        items={[
          {
            id: 'basic',
            label: 'Suggest',
            content: (
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
            ),
          },
          {
            id: 'streaming',
            label: 'Streaming',
            content: (
              <>
                <p>
                  Return an async iterable and each chunk is appended. Any
                  provider that streams text works, no SDK needed.
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
              </>
            ),
          },
        ]}
      />
      <h3>Never stale</h3>
      <Facts
        items={[
          {
            title: 'Aborts on change',
            children:
              'Typing, caret moves, menus, IME, blur and unmount cancel the request.',
          },
          {
            title: 'Exact matches only',
            children: 'A slow reply never inserts outdated text.',
          },
          {
            title: 'Quiet errors',
            children: (
              <>
                The suggestion clears and <code>onError</code> is called.
              </>
            ),
          },
        ]}
      />
    </Section>
  )
}

function AttachmentsDocs() {
  return (
    <Section
      id="attachments"
      title="Attachments"
      lede={
        <>
          Turn on <code>acceptFiles</code> and files arrive with the message.
          Bricka never uploads anything itself.
        </>
      }
    >
      <Facts
        items={[
          {
            title: 'Paste, drop or pick',
            children: (
              <>
                Picking uses <code>ComposerAttachButton</code>.
              </>
            ),
          },
          {
            title: 'Image previews',
            children: 'Shown above the input by default.',
          },
          {
            title: 'Your upload',
            children: 'Bring your own storage.',
          },
        ]}
      />
      <Topics
        label="Attachment topics"
        items={[
          {
            id: 'setup',
            label: 'Setup',
            content: (
              <Code>{`
<Composer acceptFiles="image/*,.pdf" onSubmit={({ text, attachments }) => send(text, attachments)}>
  <ComposerAttachments />
  <ComposerInput />
  <ComposerFooter>
    <ComposerAttachButton />
    <ComposerSubmit />
  </ComposerFooter>
</Composer>`}</Code>
            ),
          },
          {
            id: 'uploading',
            label: 'Uploading',
            content: (
              <>
                <p>
                  Handle <code>onFiles</code> to upload right away. Progress
                  shows, and sending waits until uploads finish.
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
              </>
            ),
          },
          {
            id: 'paste',
            label: 'Paste',
            content: (
              <>
                <Facts
                  items={[
                    {
                      title: 'Plain text',
                      children: 'Formatting from other apps never leaks in.',
                    },
                    {
                      title: 'Line breaks kept',
                      children: 'Flattened in single-line inputs.',
                    },
                    {
                      title: 'Tokens survive',
                      children: 'Copy between composers and they stay intact.',
                    },
                  ]}
                />
                <p>
                  Change it with <code>onPaste</code>, for example to turn links
                  into tokens:
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
              </>
            ),
          },
        ]}
      />
    </Section>
  )
}

const THEME_TOKENS: Array<[string, string]> = [
  ['--bricka-bg / --bricka-fg', 'Surface and text'],
  [
    '--bricka-muted / --bricka-faint',
    'Secondary text, placeholder and ghost text',
  ],
  ['--bricka-border / --bricka-border-strong', 'Resting and focused borders'],
  ['--bricka-hover / --bricka-selected', 'Hover and active backgrounds'],
  ['--bricka-accent', 'Focus rings, active tools and progress'],
  ['--bricka-token-bg / --bricka-token-fg', 'Inline tokens'],
  ['--bricka-token-selected', 'A token selected with Backspace or a click'],
  ['--bricka-popover-bg / --bricka-popover-shadow', 'Menu and tooltip surfaces'],
  ['--bricka-radius / --bricka-radius-sm', 'Composer and menu corners'],
  ['--bricka-font / --bricka-font-mono / --bricka-font-size', 'Typography'],
  ['--bricka-max-height', 'Height before the input scrolls'],
]

function StylingDocs() {
  return (
    <Section
      id="styling"
      title="Styling"
      lede="The theme is plain CSS variables. Override a few, target data attributes, or go fully headless."
    >
      <Topics
        label="Styling topics"
        items={[
          {
            id: 'variables',
            label: 'Variables',
            content: (
              <>
                <Code language="css">{`
:root {
  --bricka-accent: #0f766e;
  --bricka-token-bg: rgb(15 118 110 / 0.1);
  --bricka-token-fg: #0f766e;
  --bricka-radius: 8px;
}`}</Code>
                <dl className="prop-list" data-inline>
                  {THEME_TOKENS.map(([name, description]) => (
                    <div key={name}>
                      <dt>
                        <code>{name}</code>
                      </dt>
                      <dd>{description}</dd>
                    </div>
                  ))}
                </dl>
              </>
            ),
          },
          {
            id: 'attributes',
            label: 'Data attributes',
            content: (
              <>
                <p>
                  Every part takes <code>className</code> and exposes its state
                  as data attributes. Tokens carry <code>data-trigger</code> and{' '}
                  <code>data-type</code>.
                </p>
                <Code language="css">{`
.bricka-token[data-type='person'] { border-radius: 999px; }
.bricka-token[data-selected] { outline: 1px solid var(--bricka-accent); }
.bricka-option[data-active] { background: var(--brand-50); }
.bricka-composer[data-dragging] { border-style: dashed; }`}</Code>
              </>
            ),
          },
          {
            id: 'headless',
            label: 'Headless',
            content: (
              <p>
                Skip the stylesheet: parts render semantic markup with stable
                class names. Replace the popup with{' '}
                <code>useComposerMenu()</code> and{' '}
                <code>{'<ComposerInput menu={<MyMenu />} />'}</code>.
              </p>
            ),
          },
        ]}
      />
      <Note>
        Dark mode follows the system, or a <code>.dark</code> class or{' '}
        <code>data-theme="dark"</code> on any ancestor.
      </Note>
    </Section>
  )
}

function AccessibilityDocs() {
  return (
    <Section
      id="accessibility"
      title="Accessibility"
      lede="Built in, not bolted on. Nothing to configure."
    >
      <Facts
        items={[
          {
            title: 'A real textbox',
            children: (
              <>
                <code>aria-multiline</code>, a name and{' '}
                <code>aria-placeholder</code>.
              </>
            ),
          },
          {
            title: 'Listbox menus',
            children: (
              <>
                Focus stays in the input via <code>aria-activedescendant</code>.
                Groups are labelled.
              </>
            ),
          },
          {
            title: 'Announced changes',
            children:
              'Result counts, tokens, attachments and suggestions, politely.',
          },
          {
            title: 'Never trapped',
            children: (
              <>
                <kbd>Tab</kbd> is only taken while a suggestion shows.{' '}
                <kbd>Esc</kbd> closes one layer at a time.
              </>
            ),
          },
          {
            title: 'IME-safe',
            children: 'Nothing opens or submits while composing.',
          },
          {
            title: 'Motion and contrast',
            children:
              'Reduced motion respected; forced colors keep tokens visible.',
          },
          {
            title: 'Touch friendly',
            children: 'Bigger targets, and 16px text so iOS won’t zoom.',
          },
        ]}
      />
    </Section>
  )
}

const SHORTCUTS: Array<{ keys: ReactNode; action: ReactNode }> = [
  { keys: <kbd>Enter</kbd>, action: 'Send, or choose the menu item' },
  {
    keys: (
      <>
        <kbd>Shift</kbd> <kbd>Enter</kbd>
      </>
    ),
    action: 'New line',
  },
  {
    keys: (
      <>
        <kbd>⌘/Ctrl</kbd> <kbd>Enter</kbd>
      </>
    ),
    action: (
      <>
        Send (the only way with <code>submitKey="mod+enter"</code>)
      </>
    ),
  },
  {
    keys: (
      <>
        <kbd>↑</kbd> <kbd>↓</kbd>
      </>
    ),
    action: 'Move through the menu (or Ctrl N / P)',
  },
  { keys: <kbd>Tab</kbd>, action: 'Choose the item, or accept the suggestion' },
  {
    keys: (
      <>
        <kbd>Shift</kbd> <kbd>Tab</kbd>
      </>
    ),
    action: 'Next suggestion',
  },
  { keys: <kbd>Esc</kbd>, action: 'Close, dismiss, or deselect' },
  { keys: <kbd>⌫</kbd>, action: 'Select the token before; again to remove' },
  { keys: <kbd>Del</kbd>, action: 'Select the token after; again to remove' },
  {
    keys: (
      <>
        <kbd>←</kbd> <kbd>→</kbd>
      </>
    ),
    action: 'Step off a selected token',
  },
  {
    keys: <code>shortcut</code>,
    action: (
      <>
        Open that trigger’s menu, e.g. <code>mod+k</code>
      </>
    ),
  },
]

function KeyboardDocs() {
  return (
    <Section
      id="keyboard"
      title="Keyboard"
      lede="Everything works without a mouse."
    >
      <KeyGrid items={SHORTCUTS} />
      <Note>
        Bricka claims no shortcuts of its own. Bold and other formatting keys are
        blocked, since the content is plain text with tokens.
      </Note>
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
    <Section
      id="examples"
      title="Examples"
      lede="Three composers built from the same parts. Try them, then send."
    >
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
      <GetStarted />
      <ContextDocs />
      <CommandsDocs />
      <AutocompleteDocs />
      <AttachmentsDocs />
      <Examples />
      <ComposerDocs />
      <StylingDocs />
      <KeyboardDocs />
      <AccessibilityDocs />
      <ApiReference />
    </>
  )
}

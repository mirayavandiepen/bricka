# Bricka

A composable React input for AI apps: people type naturally and pull files, people, tools and commands into the message as structured context.

> Fix @Composer.tsx using @design-system and check /accessibility

In that sentence, `Composer.tsx`, `design-system` and `accessibility` are tokens, not text. Your app receives exactly what was referenced.

**Demo and docs:** _link coming soon_ — run them locally with `bun run dev`.

## Install

```bash
npm install @bricka/react
```

```ts
import '@bricka/react/styles.css'
```

React 18 or newer. No other runtime dependencies.

## Quick start

```tsx
import {
  Composer,
  ComposerFooter,
  ComposerInput,
  ComposerSubmit,
} from '@bricka/react'
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
    <Composer
      onSubmit={({ text, value, attachments }) =>
        send(text, value, attachments)
      }
    >
      <ComposerInput placeholder="Ask anything" triggers={[mentions]} />
      <ComposerFooter>
        <ComposerSubmit />
      </ComposerFooter>
    </Composer>
  )
}
```

State is managed for you. Pass `value` and `onValueChange` when you want to own it.

In Next.js and other server-rendered React apps, put `'use client'` at the top of the file that renders the composer, since it takes event handlers such as `onSubmit`.

## Features

- **Inline context tokens** that sit in the sentence, with icons, tooltips, selection and two-step Backspace removal.
- **Triggers**: `@` mentions, `/` commands, or any character you choose, all sharing one menu system.
- **Sync or async results** with fuzzy matching, groups, abort signals, debouncing and stale-result protection.
- **Ghost-text autocomplete** with cycling, cancellation and streaming from any provider.
- **Attachments** by paste, drop or picker. You handle storage; Bricka handles the interaction.
- **Composable parts**: attachments, input, footer, actions and submit are separate and optional.
- **Keyboard-first and accessible**: listbox semantics, live announcements, IME-safe, reduced motion.
- **Themeable** through CSS custom properties with light and dark defaults, or fully headless.

## Context

Anything your app can reference is a `ContextItem`:

```ts
{
  id: 'issue-128',
  label: '#128 Menu flickers in Safari',
  type: 'issue',
  description: 'Open',
  icon: <IssueIcon />,
  group: 'Issues',
  data: { url: 'https://…' },
}
```

Static arrays are fuzzy-filtered for you. Loaders receive the query and an `AbortSignal`:

```ts
const files: Trigger = {
  char: '@',
  label: 'Files',
  items: async ({ query, signal }) =>
    (await fetch(`/api/files?q=${query}`, { signal })).json(),
}
```

Convert content with `getText(value)`, `getTokens(value, '@')` and `serialize(value)`.

## Autocomplete

```tsx
<ComposerInput
  autocomplete={async ({ text, signal }) => {
    const response = await fetch('/api/complete', {
      method: 'POST',
      body: text,
      signal,
    })
    return response.text()
  }}
/>
```

Return a string, several strings to cycle through, or an async iterable to stream. Requests are cancelled when typing continues, and results are only shown if the text is unchanged.

## Commands

Commands are a trigger like any other. Selected commands become tokens by default; return `false` from `onSelect` to run an action instead.

```ts
const commands: Trigger = {
  char: '/',
  items: [
    {
      id: 'summarize',
      label: 'summarize',
      description: 'Summarize the thread',
    },
    { id: 'clear', label: 'clear', description: 'Clear the composer' },
  ],
  onSelect: (command, composer) => {
    if (command.id !== 'clear') return
    composer.clear()
    return false
  },
}
```

## Customization

```tsx
<Composer acceptFiles="image/*,.pdf" onSubmit={send}>
  <ComposerAttachments />
  <ComposerInput triggers={[mentions, commands]} autocomplete={suggest} />
  <ComposerFooter>
    <ComposerAttachButton />
    <ComposerAction label="Web search" isActive={web} onClick={toggleWeb}>
      <GlobeIcon />
    </ComposerAction>
    <YourModelPicker />
    <ComposerSubmit />
  </ComposerFooter>
</Composer>
```

Theme with custom properties such as `--bricka-accent`, `--bricka-token-bg` and `--bricka-radius`. Every part takes `className` and exposes state through data attributes (`data-selected`, `data-active`, `data-dragging`, `data-type`, `data-trigger`). Replace the menu with your own through `useComposerMenu()`, and reach any state or action with `useComposer()`.

## Keyboard

| Keys             | Action                                                |
| ---------------- | ----------------------------------------------------- |
| `Enter`          | Send, or choose the active item                       |
| `Shift` `Enter`  | New line                                              |
| `⌘/Ctrl` `Enter` | Send (with `submitKey="mod+enter"`)                   |
| `↑` `↓`          | Move through menu items                               |
| `Tab`            | Choose the item, or accept the suggestion             |
| `Shift` `Tab`    | Next suggestion                                       |
| `Esc`            | Close the menu or dismiss the suggestion              |
| `⌫`              | Select the token before the caret; again to remove it |

## API

| Export                                                                       | Purpose                                           |
| ---------------------------------------------------------------------------- | ------------------------------------------------- |
| `Composer`                                                                   | Root: value, attachments, submit, files, errors   |
| `ComposerInput`                                                              | The editable field: triggers, autocomplete, paste |
| `ComposerAttachments`                                                        | Attachment list with previews and progress        |
| `ComposerFooter`, `ComposerAction`, `ComposerAttachButton`, `ComposerSubmit` | Controls                                          |
| `ComposerMenu`, `useComposerMenu`                                            | Default suggestion popup, or build your own       |
| `useComposer`                                                                | State and actions from any child                  |
| `getText`, `getTokens`, `serialize`, `isEmpty`, `isEqual`, `fuzzyFilter`     | Helpers                                           |

The full reference is in the docs.

## Development

This is a Bun workspace.

```bash
bun install
bun run dev           # docs site with the live composer
bun run dev:examples  # the three example composers
bun run test          # library tests
bun run lint
bun run typecheck
bun run build         # builds packages/react
bun run build:docs
```

- `packages/react` — the library
- `examples` — coding assistant, writing assistant and agent composer
- `docs` — documentation site

## License

MIT © Miraya van Diepen. Bricka began as a fork of [fude](https://www.npmjs.com/package/@tigerabrodioss/fude) by Tiger Abrodi (MIT); see [LICENSE](LICENSE).

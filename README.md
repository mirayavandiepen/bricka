<h1 align="center">Bricka</h1>

<p align="center"><strong>The input for AI apps.</strong><br />A React composer where files, people, tools and commands live inside the message as real tokens.</p>

<p align="center">
  <a href="https://github.com/mirayavandiepen/bricka/blob/main/.github/assets/bricka-4k.mp4">
    <img src="https://raw.githubusercontent.com/mirayavandiepen/bricka/main/.github/assets/preview.gif" alt="Bricka demo: typing @ and / pulls files and commands into the message as tokens" width="960" />
  </a>
  <br />
  <a href="https://github.com/mirayavandiepen/bricka/blob/main/.github/assets/bricka-4k.mp4"><strong>▶ Watch the full demo in 4K</strong></a>
</p>

## What it does

A user types:

> Fix @Composer.tsx using @design-system and check /accessibility

In a normal textarea that is just a string. In Bricka, `Composer.tsx`, `design-system` and `accessibility` are **tokens**: structured objects with an id, a type and any data you attach. When the message is sent, your app gets the plain text _and_ exactly what was referenced, so there is nothing to parse.

Out of the box you get:

- **Tokens** that sit inline in the sentence, with icons, tooltips and two-step Backspace removal.
- **Triggers**: `@` mentions, `/` commands, or any character you choose.
- **Search** over static lists or your API, with fuzzy matching, groups, debouncing and cancellation.
- **Ghost-text autocomplete** from any model, including streaming.
- **Attachments** by paste, drag and drop, or file picker.
- **Accessibility**: full keyboard support, screen reader announcements, IME-safe input, reduced motion.
- **Theming** with light and dark defaults, CSS variables, or fully headless.

React 18 or newer. No other runtime dependencies.

## Install

```bash
npm install @mirayavandiepen/bricka
```

## Quick start

```tsx
import {
  Composer,
  ComposerFooter,
  ComposerInput,
  ComposerSubmit,
} from '@mirayavandiepen/bricka'
import '@mirayavandiepen/bricka/styles.css'

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

That's a working composer: type `@` to pick an item, press Enter to send.

- `text` is the message as plain text.
- `value` is the structured content, tokens included.
- `attachments` are the files the user added.

State is managed for you. Pass `value` and `onValueChange` if you want to control it yourself.

> **Next.js / server components:** add `'use client'` to the file that renders the composer, because it takes event handlers such as `onSubmit`.

## Guide

### 1. Context items

Everything a user can reference is a `ContextItem`. Only `id` and `label` are required.

```ts
{
  id: 'issue-128',               // required, unique
  label: '#128 Menu flickers',   // required, shown in the token and menu
  type: 'issue',                 // any string, useful for styling and icons
  description: 'Open',           // secondary text in the menu
  icon: <IssueIcon />,
  group: 'Issues',               // groups items under a heading in the menu
  data: { url: 'https://…' },    // anything you need back on submit
}
```

### 2. Triggers

A trigger connects a character to a list of items. Pass a static array and Bricka fuzzy-filters it for you, or pass a function to load results from your API:

```ts
const files: Trigger = {
  char: '@',
  label: 'Files',
  items: async ({ query, signal }) =>
    (await fetch(`/api/files?q=${query}`, { signal })).json(),
}
```

The `signal` cancels requests the user has typed past, and results that arrive out of order are ignored.

### 3. Commands

Commands are just a trigger on `/`. A selected command becomes a token by default. To run an action instead, return `false` from `onSelect`:

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

### 4. Autocomplete

Give `ComposerInput` an `autocomplete` function to show ghost-text suggestions after the caret:

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

Return a string, an array of strings (the user cycles with Shift Tab), or an async iterable to stream. Requests are cancelled as the user keeps typing, and a suggestion only appears if the text hasn't changed.

### 5. Attachments

Set `acceptFiles` on `Composer` and add `ComposerAttachments` and `ComposerAttachButton`. Users can then paste, drop or pick files. Bricka handles the interaction and previews; you decide where the files are stored.

### 6. Reading the content

Helpers for working with `value`:

| Helper                  | Returns                                          |
| ----------------------- | ------------------------------------------------ |
| `getText(value)`        | The message as plain text                        |
| `getTokens(value, '@')` | The referenced items, optionally for one trigger |
| `serialize(value)`      | JSON-safe segments to store or send to your API  |
| `isEmpty(value)`        | Whether there is anything to send                |

## Customization

Every part is a separate component, so you only render what you need and can add your own controls in between:

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

**Styling.** Override CSS variables such as `--bricka-accent`, `--bricka-token-bg` and `--bricka-radius`, or pass `className` to any part. State is exposed through data attributes: `data-selected`, `data-active`, `data-dragging`, `data-type` and `data-trigger`.

**Going further.** Build your own suggestion menu with `useComposerMenu()`, and read state or call actions from any child with `useComposer()`.

## Keyboard

| Keys             | Action                                                      |
| ---------------- | ----------------------------------------------------------- |
| `Enter`          | Send, or choose the highlighted item                        |
| `Shift` `Enter`  | New line                                                    |
| `⌘/Ctrl` `Enter` | Send (with `submitKey="mod+enter"`)                         |
| `↑` `↓`          | Move through menu items                                     |
| `Tab`            | Choose the item, or accept the suggestion                   |
| `Shift` `Tab`    | Next suggestion                                             |
| `Esc`            | Close the menu or dismiss the suggestion                    |
| `⌫`              | Select the token before the caret; press again to remove it |

## API

| Export                                                                       | Purpose                                         |
| ---------------------------------------------------------------------------- | ----------------------------------------------- |
| `Composer`                                                                   | Root: value, attachments, submit, files, errors |
| `ComposerInput`                                                              | The text field: triggers, autocomplete, paste   |
| `ComposerAttachments`                                                        | Attachment list with previews and progress      |
| `ComposerFooter`, `ComposerAction`, `ComposerAttachButton`, `ComposerSubmit` | Controls below the input                        |
| `ComposerMenu`, `useComposerMenu`                                            | Default suggestion menu, or build your own      |
| `useComposer`                                                                | State and actions from any child                |
| `getText`, `getTokens`, `serialize`, `isEmpty`, `isEqual`, `fuzzyFilter`     | Helpers                                         |

The full reference is in the docs site (`bun run dev`, see below).

## Contributing

This repo is a Bun workspace:

| Folder           | Contents                                                |
| ---------------- | ------------------------------------------------------- |
| `packages/react` | The library                                             |
| `docs`           | Documentation site with the live composer               |
| `examples`       | Coding assistant, writing assistant and agent composers |
| `video`          | The demo video                                          |

```bash
bun install
bun run dev           # docs site
bun run dev:examples  # example composers
bun run test
bun run lint
bun run typecheck
bun run build         # builds packages/react
bun run build:docs
```

## License

MIT © Miraya van Diepen. See [LICENSE](LICENSE).

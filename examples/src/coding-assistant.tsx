import {
  Composer,
  ComposerAction,
  ComposerAttachButton,
  ComposerAttachments,
  ComposerFooter,
  ComposerInput,
  ComposerSubmit,
  fuzzyFilter,
  type ComposerApi,
  type ComposerMessage,
  type ComposerValue,
  type ContextItem,
  type Trigger,
} from '@bricka/react'
import { useState, type Ref } from 'react'
import {
  BranchIcon,
  ChatIcon,
  EyeIcon,
  FileIcon,
  FlaskIcon,
  FolderIcon,
  GlobeIcon,
  IssueIcon,
  WrenchIcon,
} from './icons'
import { complete, wait } from './mock'
import { ModelSelect } from './parts'

const repository: Array<ContextItem> = [
  {
    id: 'package.json',
    label: 'package.json',
    type: 'file',
    group: 'Files',
    description: 'Root',
    icon: <FileIcon />,
  },
  {
    id: 'src/components/Composer.tsx',
    label: 'Composer.tsx',
    type: 'file',
    group: 'Files',
    description: 'src/components',
    icon: <FileIcon />,
  },
  {
    id: 'src/hooks/use-composer.ts',
    label: 'use-composer.ts',
    type: 'file',
    group: 'Files',
    description: 'src/hooks',
    icon: <FileIcon />,
  },
  {
    id: 'src/styles/tokens.css',
    label: 'tokens.css',
    type: 'file',
    group: 'Files',
    description: 'src/styles',
    icon: <FileIcon />,
  },
  {
    id: 'src/components',
    label: 'src/components',
    type: 'folder',
    group: 'Folders',
    description: '14 files',
    icon: <FolderIcon />,
  },
  {
    id: 'src/hooks',
    label: 'src/hooks',
    type: 'folder',
    group: 'Folders',
    description: '6 files',
    icon: <FolderIcon />,
  },
  {
    id: 'issue-128',
    label: '#128 Menu flickers in Safari',
    type: 'issue',
    group: 'Issues',
    description: 'Open',
    icon: <IssueIcon />,
    keywords: ['bug', 'github'],
  },
  {
    id: 'issue-131',
    label: '#131 Paste keeps formatting',
    type: 'issue',
    group: 'Issues',
    description: 'Open',
    icon: <IssueIcon />,
    keywords: ['bug', 'github'],
  },
  {
    id: 'branch-main',
    label: 'main',
    type: 'branch',
    group: 'Branches',
    description: 'Default branch',
    icon: <BranchIcon />,
  },
  {
    id: 'web-search',
    label: 'Web search',
    type: 'tool',
    group: 'Tools',
    description: 'Search the web',
    icon: <GlobeIcon />,
  },
]

// Mentions load asynchronously, as a repository search would.
const mentions: Trigger = {
  char: '@',
  label: 'Context',
  items: async ({ query, signal }) => {
    await wait(90, signal)
    return fuzzyFilter(repository, query)
  },
}

const commands: Trigger = {
  char: '/',
  label: 'Commands',
  shortcut: 'mod+k',
  items: [
    {
      id: 'explain',
      label: 'explain',
      description: 'Explain how code works',
      icon: <ChatIcon />,
    },
    {
      id: 'fix',
      label: 'fix',
      description: 'Find and fix a bug',
      icon: <WrenchIcon />,
    },
    {
      id: 'test',
      label: 'test',
      description: 'Write tests',
      icon: <FlaskIcon />,
    },
    {
      id: 'review',
      label: 'review',
      description: 'Review the changes',
      icon: <EyeIcon />,
    },
  ],
}

const triggers = [mentions, commands]

const completions: Array<[RegExp, Array<string>]> = [
  [/\bfix$/i, ['the failing test in', 'the type errors in']],
  [/\bwhy does$/i, ['this re-render on every keystroke?']],
  [/\brefactor$/i, ['this into smaller hooks', 'this to use a reducer']],
  [/\badd$/i, ['tests for the empty state', 'keyboard support to']],
  [/\bmake$/i, ['this accessible', 'the menu keyboard-friendly']],
  [/\bexplain$/i, ['how the caret is positioned']],
  [/\bcheck$/i, ['for regressions in']],
]

const MODELS = ['Balanced', 'Fast', 'Thorough']

export const CODING_EXAMPLE_VALUE: ComposerValue = [
  { type: 'text', text: 'Fix ' },
  { type: 'token', trigger: '@', item: repository[1] },
  { type: 'text', text: ' so the menu stops flickering in Safari, then ' },
  {
    type: 'token',
    trigger: '/',
    item: {
      id: 'test',
      label: 'test',
      description: 'Write tests',
      icon: <FlaskIcon />,
    },
  },
  { type: 'text', text: ' it' },
]

export function CodingAssistant({
  onSend,
  onValueChange,
  defaultValue,
  autoFocus,
  composerRef,
}: {
  onSend?: (message: ComposerMessage) => void
  onValueChange?: (value: ComposerValue) => void
  defaultValue?: ComposerValue
  autoFocus?: boolean
  composerRef?: Ref<ComposerApi>
}) {
  const [model, setModel] = useState(MODELS[0])
  const [isSearchEnabled, setIsSearchEnabled] = useState(false)

  return (
    <Composer
      ref={composerRef}
      acceptFiles
      defaultValue={defaultValue}
      onSubmit={onSend}
      onValueChange={onValueChange}
    >
      <ComposerAttachments />
      <ComposerInput
        autoFocus={autoFocus}
        placeholder="Ask about your code…"
        aria-label="Message the coding assistant"
        triggers={triggers}
        autocomplete={{
          delay: 350,
          suggest: async ({ text, signal }) => {
            await wait(220, signal)
            return complete(text, completions)
          },
        }}
      />
      <ComposerFooter>
        <ComposerAttachButton />
        <ComposerAction
          label="Web search"
          isActive={isSearchEnabled}
          onClick={() => setIsSearchEnabled((value) => !value)}
        >
          <GlobeIcon />
        </ComposerAction>
        <span className="example-divider" aria-hidden />
        <ModelSelect models={MODELS} value={model} onChange={setModel} />
        <ComposerSubmit />
      </ComposerFooter>
    </Composer>
  )
}

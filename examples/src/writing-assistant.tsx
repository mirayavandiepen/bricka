import {
  Composer,
  ComposerFooter,
  ComposerInput,
  ComposerSubmit,
  getText,
  useComposer,
  type ComposerMessage,
  type Trigger,
} from '@bricka/react'
import { useState } from 'react'
import {
  ArticleIcon,
  DocumentIcon,
  ListIcon,
  PenIcon,
  PersonIcon,
  QuoteIcon,
  TuneIcon,
} from './icons'
import { complete, streamWords } from './mock'
import { ModelSelect } from './parts'

const references: Trigger = {
  char: '@',
  label: 'References',
  items: [
    {
      id: 'doc-brief',
      label: 'Q3 launch brief',
      type: 'document',
      group: 'Documents',
      description: 'Edited 2h ago',
      icon: <DocumentIcon />,
    },
    {
      id: 'doc-voice',
      label: 'Voice & tone guide',
      type: 'document',
      group: 'Documents',
      description: 'Brand',
      icon: <DocumentIcon />,
    },
    {
      id: 'person-ana',
      label: 'Ana Ruiz',
      type: 'person',
      group: 'People',
      description: 'Product marketing',
      icon: <PersonIcon />,
    },
    {
      id: 'person-sam',
      label: 'Sam Okafor',
      type: 'person',
      group: 'People',
      description: 'Editor',
      icon: <PersonIcon />,
    },
    {
      id: 'article-hn',
      label: 'Why small teams ship faster',
      type: 'article',
      group: 'Articles',
      description: 'Blog',
      icon: <ArticleIcon />,
    },
    {
      id: 'source-survey',
      label: '2026 customer survey',
      type: 'source',
      group: 'Sources',
      description: 'n = 1,240',
      icon: <QuoteIcon />,
    },
  ],
}

const actions: Trigger = {
  char: '/',
  label: 'Actions',
  items: [
    {
      id: 'rewrite',
      label: 'rewrite',
      description: 'Rewrite for clarity',
      icon: <PenIcon />,
    },
    {
      id: 'summarize',
      label: 'summarize',
      description: 'Summarize in three bullets',
      icon: <ListIcon />,
    },
    {
      id: 'shorten',
      label: 'shorten',
      description: 'Cut it by half',
      icon: <PenIcon />,
    },
    {
      id: 'tone',
      label: 'tone',
      description: 'Adjust the tone',
      icon: <TuneIcon />,
    },
  ],
}

const triggers = [references, actions]

const drafts: Array<[RegExp, Array<string>]> = [
  [
    /\bwe are$/i,
    ['excited to share what the team has been building this quarter.'],
  ],
  [/\bthis quarter$/i, [', we focused on making onboarding feel effortless.']],
  [/\bthank you$/i, ['for the thoughtful feedback on the first draft.']],
  [/\bin short$/i, [', the new flow cuts setup time from days to minutes.']],
  [/\bthe goal$/i, ['is simple: fewer steps, clearer defaults.']],
]

function WordCount() {
  const { value } = useComposer()
  const words = getText(value).trim().split(/\s+/).filter(Boolean).length
  // Hidden until there's something to count; fades in beside Send.
  return (
    <span className="example-status" data-empty={words === 0 || undefined}>
      {words === 1 ? '1 word' : `${words} words`}
    </span>
  )
}

const TONES = [
  { value: 'Neutral', description: 'Plain and clear' },
  { value: 'Friendly', description: 'Warm and relaxed' },
  { value: 'Formal', description: 'Polished and precise' },
]

export function WritingAssistant({
  onSend,
}: {
  onSend?: (message: ComposerMessage) => void
}) {
  const [tone, setTone] = useState(TONES[0].value)

  return (
    <Composer onSubmit={onSend}>
      <ComposerInput
        placeholder="Draft something. ⌘↵ to send"
        aria-label="Draft with the writing assistant"
        submitKey="mod+enter"
        triggers={triggers}
        autocomplete={{
          delay: 450,
          // Stream the continuation word by word, like a model response.
          suggest: ({ text, signal }) => {
            const [suggestion] = complete(text, drafts)
            return suggestion ? streamWords(suggestion, signal) : null
          },
        }}
      />
      <ComposerFooter>
        <ModelSelect
          label="Tone"
          options={TONES}
          value={tone}
          onChange={setTone}
        />
        <WordCount />
        <ComposerSubmit />
      </ComposerFooter>
    </Composer>
  )
}

import {
  Composer,
  ComposerAction,
  ComposerFooter,
  ComposerInput,
  ComposerSubmit,
  fuzzyFilter,
  useComposer,
  type ComposerMessage,
  type ContextItem,
  type Trigger,
} from '@inlay/react'
import {
  AgentIcon,
  DatabaseIcon,
  DocumentIcon,
  EraserIcon,
  GlobeIcon,
  ListIcon,
  SearchIcon,
  WrenchIcon,
} from './icons'
import { wait } from './mock'

const agents: Trigger = {
  char: '@',
  label: 'Agents',
  items: [
    {
      id: 'researcher',
      label: 'Researcher',
      type: 'agent',
      description: 'Finds and cites sources',
      icon: <AgentIcon />,
    },
    {
      id: 'reviewer',
      label: 'Reviewer',
      type: 'agent',
      description: 'Checks work for mistakes',
      icon: <AgentIcon />,
    },
    {
      id: 'planner',
      label: 'Planner',
      type: 'agent',
      description: 'Breaks goals into steps',
      icon: <AgentIcon />,
    },
    {
      id: 'analyst',
      label: 'Analyst',
      type: 'agent',
      description: 'Queries and charts data',
      icon: <AgentIcon />,
      disabled: true,
    },
  ],
}

const resourceIndex: Array<ContextItem> = [
  {
    id: 'ds-orders',
    label: 'orders',
    type: 'dataset',
    group: 'Datasets',
    description: '2.1M rows',
    icon: <DatabaseIcon />,
  },
  {
    id: 'ds-customers',
    label: 'customers',
    type: 'dataset',
    group: 'Datasets',
    description: '84k rows',
    icon: <DatabaseIcon />,
  },
  {
    id: 'doc-runbook',
    label: 'Incident runbook',
    type: 'document',
    group: 'Documents',
    description: 'Ops',
    icon: <DocumentIcon />,
  },
  {
    id: 'doc-pricing',
    label: 'Pricing model',
    type: 'document',
    group: 'Documents',
    description: 'Finance',
    icon: <DocumentIcon />,
  },
  {
    id: 'web-status',
    label: 'status.example.com',
    type: 'url',
    group: 'Links',
    description: 'Status page',
    icon: <GlobeIcon />,
  },
]

// A slow, debounced search that sometimes fails, to show loading and errors.
const resources: Trigger = {
  char: '#',
  label: 'Resources',
  debounce: 120,
  items: async ({ query, signal }) => {
    await wait(350, signal)
    if (query === 'error') throw new Error('Resource search is unavailable')
    return fuzzyFilter(resourceIndex, query)
  },
  emptyMessage: 'No resources. Try “orders” or type “error”.',
}

const tools: Trigger = {
  char: '/',
  label: 'Tools',
  items: [
    {
      id: 'search',
      label: 'search',
      description: 'Search the web',
      icon: <SearchIcon />,
      group: 'Tools',
    },
    {
      id: 'run',
      label: 'run',
      description: 'Run a workflow',
      icon: <WrenchIcon />,
      group: 'Tools',
    },
    {
      id: 'plan',
      label: 'plan',
      description: 'Plan before acting',
      icon: <ListIcon />,
      group: 'Tools',
    },
    {
      id: 'clear',
      label: 'clear',
      description: 'Clear the composer',
      icon: <EraserIcon />,
      group: 'Actions',
    },
  ],
  // Actions run immediately instead of becoming part of the message.
  onSelect: (item, composer) => {
    if (item.id !== 'clear') return
    composer.clear()
    return false
  },
}

const triggers = [agents, resources, tools]

function InsertButtons() {
  const { openTrigger } = useComposer()
  return (
    <>
      <ComposerAction label="Mention an agent" onClick={() => openTrigger('@')}>
        <span aria-hidden>@</span>
      </ComposerAction>
      <ComposerAction label="Add a resource" onClick={() => openTrigger('#')}>
        <span aria-hidden>#</span>
      </ComposerAction>
      <ComposerAction label="Use a tool" onClick={() => openTrigger('/')}>
        <span aria-hidden>/</span>
      </ComposerAction>
    </>
  )
}

export function AgentComposer({
  onSend,
  onError,
}: {
  onSend?: (message: ComposerMessage) => void
  onError?: (error: unknown) => void
}) {
  return (
    <Composer onSubmit={onSend} onError={onError}>
      <ComposerInput
        placeholder="Give the agents a task…"
        aria-label="Task for the agents"
        triggers={triggers}
      />
      <ComposerFooter>
        <InsertButtons />
        <ComposerSubmit />
      </ComposerFooter>
    </Composer>
  )
}

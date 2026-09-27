export type NavItem = { id: string; label: string }

export const NAV_GROUPS: Array<{ label: string; items: Array<NavItem> }> = [
  {
    label: 'Start',
    items: [
      { id: 'introduction', label: 'Introduction' },
      { id: 'get-started', label: 'Get started' },
    ],
  },
  {
    label: 'Features',
    items: [
      { id: 'context', label: 'Mentions' },
      { id: 'commands', label: 'Commands' },
      { id: 'autocomplete', label: 'AI autocomplete' },
      { id: 'attachments', label: 'Attachments' },
      { id: 'examples', label: 'Examples' },
    ],
  },
  {
    label: 'Customize',
    items: [
      { id: 'composer', label: 'Composer' },
      { id: 'styling', label: 'Styling' },
    ],
  },
  {
    label: 'Reference',
    items: [
      { id: 'keyboard', label: 'Keyboard' },
      { id: 'accessibility', label: 'Accessibility' },
      { id: 'api', label: 'API reference' },
    ],
  },
]

export const NAV: Array<NavItem> = NAV_GROUPS.flatMap((group) => group.items)

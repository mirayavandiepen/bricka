import {
  createContext,
  useContext,
  useEffect,
  useState,
  type CSSProperties,
  type MutableRefObject,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { fuzzyMatch } from '../fuzzy'
import type { ContextItem } from '../types'
import type { ComposerLabels } from './context'
import { readThemeVariables } from './theme'
import type { MenuState } from './use-trigger-menu'

export type MenuContextValue = {
  menu: MenuState | null
  labels: ComposerLabels
  listboxId: string
  getOptionId: (index: number) => string
  menuElementRef: MutableRefObject<HTMLDivElement | null>
  themeSource: () => HTMLElement | null
  select: (index: number) => void
  setActive: (index: number) => void
}

export const MenuContext = createContext<MenuContextValue | null>(null)

/** Menu state for building a custom suggestion popup. */
export function useComposerMenu(): MenuContextValue {
  const context = useContext(MenuContext)
  if (!context) {
    throw new Error('useComposerMenu must be used inside <ComposerInput>.')
  }
  return context
}

function Highlight({ text, query }: { text: string; query: string }) {
  const match = query ? fuzzyMatch(query, text) : null
  if (!match || match.indices.length === 0) return <>{text}</>
  const marked = new Set(match.indices)
  const parts: Array<ReactNode> = []
  let run = ''
  let isRunMarked = false
  for (let i = 0; i <= text.length; i++) {
    const isMarked = marked.has(i)
    if (i === text.length || (run.length > 0 && isMarked !== isRunMarked)) {
      parts.push(
        isRunMarked ? (
          <mark key={i} className="bricka-match">
            {run}
          </mark>
        ) : (
          run
        )
      )
      run = ''
    }
    run += text[i] ?? ''
    isRunMarked = isMarked
  }
  return <>{parts}</>
}

function DefaultItem({
  item,
  fallbackIcon,
  query,
}: {
  item: ContextItem
  fallbackIcon: ReactNode
  query: string
}) {
  const icon = item.icon ?? fallbackIcon
  return (
    <>
      {icon && (
        <span className="bricka-option-icon" aria-hidden>
          {icon}
        </span>
      )}
      <span className="bricka-option-label">
        <Highlight text={item.label} query={query} />
      </span>
      {item.description && (
        <span className="bricka-option-description">{item.description}</span>
      )}
    </>
  )
}

type Section = { group?: string; start: number; items: Array<ContextItem> }

function toSections(items: Array<ContextItem>): Array<Section> {
  const sections: Array<Section> = []
  items.forEach((item, index) => {
    const last = sections[sections.length - 1]
    if (last && last.group === item.group) last.items.push(item)
    else sections.push({ group: item.group, start: index, items: [item] })
  })
  return sections
}

export type ComposerMenuProps = {
  className?: string
  style?: CSSProperties
}

/** The default suggestion popup. Renders in `document.body`. */
export function ComposerMenu({ className, style }: ComposerMenuProps) {
  const {
    menu,
    labels,
    listboxId,
    getOptionId,
    menuElementRef,
    themeSource,
    select,
    setActive,
  } = useComposerMenu()
  const isOpen = menu !== null
  const [theme, setTheme] = useState<CSSProperties | undefined>()

  useEffect(() => {
    if (isOpen) setTheme(readThemeVariables(themeSource()))
  }, [isOpen, themeSource])

  const activeIndex = menu?.activeIndex ?? -1
  useEffect(() => {
    if (activeIndex < 0) return
    const option = document.getElementById(getOptionId(activeIndex))
    option?.scrollIntoView?.({ block: 'nearest' })
  }, [activeIndex, getOptionId])

  if (!menu?.position || typeof document === 'undefined') return null
  const { trigger, items, status, query, position } = menu
  if (status === 'idle' && items.length === 0) return null

  let notice: ReactNode = null
  if (items.length === 0) {
    if (status === 'loading') notice = labels.loading
    else if (status === 'error') notice = labels.loadFailed
    else notice = trigger.emptyMessage ?? labels.noResults
  }

  return createPortal(
    <div
      ref={menuElementRef}
      className={['bricka-menu', className].filter(Boolean).join(' ')}
      data-placement={position.placement}
      data-status={status}
      style={{
        ...theme,
        position: 'fixed',
        top: position.top,
        left: position.left,
        width: position.width,
        maxHeight: position.maxHeight,
        transform:
          position.placement === 'above' ? 'translateY(-100%)' : undefined,
        ...style,
      }}
      onMouseDown={(event) => event.preventDefault()}
    >
      {status === 'loading' && items.length > 0 && (
        <div className="bricka-menu-progress" aria-hidden />
      )}
      <div
        id={listboxId}
        role="listbox"
        aria-label={trigger.label ?? 'Suggestions'}
        aria-busy={status === 'loading' || undefined}
        className="bricka-menu-list"
      >
        {toSections(items).map((section) => {
          const labelId = `${listboxId}-group-${section.start}`
          const options = section.items.map((item, offset) => {
            const index = section.start + offset
            const isActive = index === activeIndex
            return (
              <div
                key={`${item.id}-${index}`}
                id={getOptionId(index)}
                role="option"
                aria-selected={isActive}
                aria-disabled={item.disabled || undefined}
                data-active={isActive || undefined}
                data-type={item.type}
                className="bricka-option"
                onPointerMove={() => setActive(index)}
                onClick={() => select(index)}
              >
                {trigger.renderItem ? (
                  trigger.renderItem(item, { isActive })
                ) : (
                  <DefaultItem
                    item={item}
                    fallbackIcon={trigger.icon}
                    query={query}
                  />
                )}
              </div>
            )
          })
          if (!section.group) return options
          return (
            <div
              key={labelId}
              role="group"
              aria-labelledby={labelId}
              className="bricka-menu-group"
            >
              <div
                id={labelId}
                role="presentation"
                className="bricka-menu-group-label"
              >
                {section.group}
              </div>
              {options}
            </div>
          )
        })}
      </div>
      {notice !== null && (
        <div className="bricka-menu-notice" data-status={status}>
          {notice}
        </div>
      )}
    </div>,
    document.body
  )
}

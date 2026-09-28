import {
  memo,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { createPortal } from 'react-dom'
import type { ContextItem, Trigger } from '../types'
import { CloseIcon } from './icons'
import { readThemeVariables } from './theme'

const TOOLTIP_DELAY = 450

type TokenViewProps = {
  item: ContextItem
  trigger?: Trigger
  char?: string
  host: HTMLElement
  isSelected: boolean
  removeLabel: string
  onSelect: (host: HTMLElement) => void
  onRemove: (host: HTMLElement) => void
}

type TooltipPosition = { top: number; left: number; isBelow: boolean }

function Tooltip({
  anchor,
  children,
}: {
  anchor: HTMLElement
  children: string
}) {
  const [position, setPosition] = useState<TooltipPosition | null>(null)
  const [theme] = useState(() =>
    readThemeVariables(anchor.closest<HTMLElement>('.bricka-composer'))
  )

  useLayoutEffect(() => {
    const rect = anchor.getBoundingClientRect()
    const isBelow = rect.top < 40
    setPosition({
      top: isBelow ? rect.bottom + 6 : rect.top - 6,
      left: Math.min(
        Math.max(rect.left + rect.width / 2, 12),
        window.innerWidth - 12
      ),
      isBelow,
    })
  }, [anchor])

  if (!position) return null
  const style: CSSProperties = {
    ...theme,
    position: 'fixed',
    top: position.top,
    left: position.left,
    transform: `translate(-50%, ${position.isBelow ? '0' : '-100%'})`,
  }
  return createPortal(
    <div className="bricka-tooltip" role="tooltip" style={style}>
      {children}
    </div>,
    document.body
  )
}

/** Inline token rendered into its host span through a portal. */
export const TokenView = memo(function TokenView({
  item,
  trigger,
  char,
  host,
  isSelected,
  removeLabel,
  onSelect,
  onRemove,
}: TokenViewProps) {
  const rootRef = useRef<HTMLSpanElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [isTooltipOpen, setIsTooltipOpen] = useState(false)

  useEffect(() => {
    if (!isHovered) {
      setIsTooltipOpen(false)
      return
    }
    const timer = window.setTimeout(() => setIsTooltipOpen(true), TOOLTIP_DELAY)
    return () => window.clearTimeout(timer)
  }, [isHovered])

  const icon = item.icon ?? trigger?.icon
  const isRemoveVisible = isHovered || isSelected
  const shouldShowTooltip =
    Boolean(item.description) && (isTooltipOpen || isSelected)

  return (
    <span
      ref={rootRef}
      className="bricka-token"
      data-selected={isSelected || undefined}
      data-type={item.type}
      data-trigger={char}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={(event) => {
        event.preventDefault()
        onSelect(host)
      }}
    >
      {trigger?.renderToken ? (
        trigger.renderToken(item)
      ) : (
        <>
          <span className="bricka-token-icon" aria-hidden>
            {isRemoveVisible ? (
              <span
                className="bricka-token-remove"
                title={`${removeLabel} ${item.label}`}
                onMouseDown={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  onRemove(host)
                }}
              >
                <CloseIcon width={12} height={12} />
              </span>
            ) : (
              (icon ?? <span className="bricka-token-char">{char}</span>)
            )}
          </span>
          <span className="bricka-token-label">{item.label}</span>
        </>
      )}
      {shouldShowTooltip && rootRef.current && (
        <Tooltip anchor={rootRef.current}>{item.description!}</Tooltip>
      )}
    </span>
  )
})

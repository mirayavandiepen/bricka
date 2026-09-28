import type { ReactNode, SVGProps } from 'react'

function icon(paths: ReactNode, viewBox = '0 0 16 16', strokeWidth = 1.4) {
  return function Icon(props: SVGProps<SVGSVGElement>) {
    return (
      <svg
        width="16"
        height="16"
        viewBox={viewBox}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        {paths}
      </svg>
    )
  }
}

export const FileIcon = icon(
  <>
    <path d="M9 1.75H4.5a1 1 0 00-1 1v10.5a1 1 0 001 1h7a1 1 0 001-1V5.25z" />
    <path d="M9 1.75v3.5h3.5" />
  </>
)
export const FolderIcon = icon(
  <path d="M1.75 4.25a1 1 0 011-1h3.1l1.4 1.5h6a1 1 0 011 1v6.5a1 1 0 01-1 1H2.75a1 1 0 01-1-1z" />
)
export const IssueIcon = icon(
  <>
    <circle cx="8" cy="8" r="6.25" />
    <circle cx="8" cy="8" r="1.25" fill="currentColor" stroke="none" />
  </>
)
export const BranchIcon = icon(
  <>
    <circle cx="4.5" cy="3.5" r="1.5" />
    <circle cx="4.5" cy="12.5" r="1.5" />
    <circle cx="11.5" cy="5" r="1.5" />
    <path d="M4.5 5v6M11.5 6.5c0 2.5-3 2.5-7 4.5" />
  </>
)
export const GlobeIcon = icon(
  <>
    <circle cx="8" cy="8" r="6.25" />
    <path d="M1.75 8h12.5M8 1.75c1.8 2 2.6 4 2.6 6.25S9.8 12.25 8 14.25C6.2 12.25 5.4 10.25 5.4 8S6.2 3.75 8 1.75z" />
  </>
)
export const PersonIcon = icon(
  <>
    <circle cx="8" cy="5.5" r="2.75" />
    <path d="M2.75 14c.6-2.6 2.7-4.25 5.25-4.25s4.65 1.65 5.25 4.25" />
  </>
)
export const DocumentIcon = icon(
  <>
    <rect x="3" y="1.75" width="10" height="12.5" rx="1" />
    <path d="M5.5 5.25h5M5.5 8h5M5.5 10.75h3" />
  </>
)
export const WrenchIcon = icon(
  <path d="M9.75 2.25a3.25 3.25 0 00-3 4.5L2.5 11a1.4 1.4 0 002 2l4.25-4.25a3.25 3.25 0 004.5-3l-1.9 1.9-1.75-.25-.25-1.75 1.9-1.9a3.2 3.2 0 00-1.5-.5z" />
)
export const FlaskIcon = icon(
  <path d="M6.25 1.75h3.5M6.75 1.75v4.5L2.9 12.6a1.1 1.1 0 00.95 1.65h8.3a1.1 1.1 0 00.95-1.65L9.25 6.25v-4.5M4.5 10h7" />
)
export const EyeIcon = icon(
  <>
    <path d="M1.75 8S4 3.75 8 3.75 14.25 8 14.25 8 12 12.25 8 12.25 1.75 8 1.75 8z" />
    <circle cx="8" cy="8" r="1.75" />
  </>
)
export const ChatIcon = icon(
  <path d="M2.25 7.75c0-2.9 2.6-5 5.75-5s5.75 2.1 5.75 5-2.6 5-5.75 5c-.8 0-1.6-.1-2.3-.4L2.5 13.5l.7-2.6a4.6 4.6 0 01-.95-3.15z" />
)
export const PaperclipIcon = icon(
  <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l8.57-8.57A4 4 0 1118 8.84l-8.59 8.57a2 2 0 01-2.83-2.83l8.49-8.48" />,
  '0 0 24 24',
  2.1
)
export const ArrowUpIcon = icon(
  <path d="M8 13V3.5M3.75 7.75L8 3.5l4.25 4.25" />,
  '0 0 16 16',
  1.6
)
export const CheckIcon = icon(<path d="M3 8.5l3.25 3.25L13 5" />, '0 0 16 16', 1.8)
export const CopyIcon = icon(
  <>
    <rect x="5.25" y="5.25" width="8.5" height="8.5" rx="1.75" />
    <path d="M10.75 5.25V3.5a1.25 1.25 0 00-1.25-1.25H3.5A1.25 1.25 0 002.25 3.5v6a1.25 1.25 0 001.25 1.25h1.75" />
  </>
)
export const SunIcon = icon(
  <>
    <circle cx="8" cy="8" r="2.75" />
    <path d="M8 1.5v1.25M8 13.25v1.25M1.5 8h1.25M13.25 8h1.25M3.4 3.4l.9.9M11.7 11.7l.9.9M3.4 12.6l.9-.9M11.7 4.3l.9-.9" />
  </>
)
export const MoonIcon = icon(
  <path d="M13.5 9.75A5.75 5.75 0 016.25 2.5a5.75 5.75 0 107.25 7.25z" />
)
export const ChevronIcon = icon(<path d="M4.5 6.25L8 9.75l3.5-3.5" />)
export const SparkIcon = icon(
  <path d="M8 1.75l1.4 4.1 4.35.15-3.45 2.65 1.25 4.2L8 10.4l-3.55 2.45 1.25-4.2L2.25 6l4.35-.15z" />
)

/** The mark: a token and the caret after it. Nothing else. */
export const LOGO = {
  token: { x: 0, y: 9, width: 22, height: 14, rx: 7 },
  caret: { x: 26, y: 4, width: 4, height: 24, rx: 2 },
}

export function Logo({ size = 64, caret = '#f5f5f7' }: { size?: number; caret?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 32">
      <rect {...LOGO.token} fill="#2f7df6" />
      <rect {...LOGO.caret} fill={caret} />
    </svg>
  )
}

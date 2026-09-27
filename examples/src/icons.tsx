import type { ReactNode, SVGProps } from 'react'

function icon(paths: ReactNode) {
  return function Icon(props: SVGProps<SVGSVGElement>) {
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
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
export const ArticleIcon = icon(
  <>
    <path d="M2.25 3.25h8.5v10H3.25a1 1 0 01-1-1z" />
    <path d="M10.75 5.75h3v6.5a1 1 0 01-1 1h-2M4.75 6h3.5M4.75 8.5h3.5" />
  </>
)
export const QuoteIcon = icon(
  <path d="M3 10.5c0-3 1-5 3.5-6M3 10.5a1.75 1.75 0 103.5 0 1.75 1.75 0 00-3.5 0zM9 10.5c0-3 1-5 3.5-6M9 10.5a1.75 1.75 0 103.5 0 1.75 1.75 0 00-3.5 0z" />
)
export const AgentIcon = icon(
  <>
    <rect x="2.75" y="4.75" width="10.5" height="8" rx="2" />
    <path d="M8 2v2.75M6 8.5v.5M10 8.5v.5" />
  </>
)
export const DatabaseIcon = icon(
  <>
    <ellipse cx="8" cy="3.75" rx="5" ry="1.75" />
    <path d="M3 3.75v8.5c0 1 2.2 1.75 5 1.75s5-.75 5-1.75v-8.5M3 8c0 1 2.2 1.75 5 1.75S13 9 13 8" />
  </>
)
export const WrenchIcon = icon(
  <path d="M9.75 2.25a3.25 3.25 0 00-3 4.5L2.5 11a1.4 1.4 0 002 2l4.25-4.25a3.25 3.25 0 004.5-3l-1.9 1.9-1.75-.25-.25-1.75 1.9-1.9a3.2 3.2 0 00-1.5-.5z" />
)
export const SearchIcon = icon(
  <>
    <circle cx="7" cy="7" r="4.5" />
    <path d="M10.5 10.5l3.25 3.25" />
  </>
)
export const PenIcon = icon(
  <path d="M10.5 2.75l2.75 2.75-7.5 7.5H3v-2.75zM9 4.25l2.75 2.75" />
)
export const ListIcon = icon(
  <path d="M5.5 4h8M5.5 8h8M5.5 12h8M2.5 4h.01M2.5 8h.01M2.5 12h.01" />
)
export const ChatIcon = icon(
  <path d="M2.25 7.75c0-2.9 2.6-5 5.75-5s5.75 2.1 5.75 5-2.6 5-5.75 5c-.8 0-1.6-.1-2.3-.4L2.5 13.5l.7-2.6a4.6 4.6 0 01-.95-3.15z" />
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
export const EraserIcon = icon(
  <path d="M6.25 13.25h7M9.5 2.9l3.6 3.6a1 1 0 010 1.4l-4.9 4.9a1 1 0 01-.7.3H5.2a1 1 0 01-.7-.3l-1.6-1.6a1 1 0 010-1.4L8.1 2.9a1 1 0 011.4 0zM5.25 6.25l4.5 4.5" />
)
export const TuneIcon = icon(
  <path d="M2.5 4.5h6M11.5 4.5h2M2.5 11.5h2M7.5 11.5h6M8.5 3v3M5.5 10v3" />
)

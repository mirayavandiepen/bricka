import type { SVGProps } from 'react'

function Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
      {...props}
    />
  )
}

export function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />
    </Icon>
  )
}

/** Drawn on a 24 grid so it fills the box like the other icons do. */
export function PaperclipIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon viewBox="0 0 24 24" strokeWidth="2.1" {...props}>
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l8.57-8.57A4 4 0 1118 8.84l-8.59 8.57a2 2 0 01-2.83-2.83l8.49-8.48" />
    </Icon>
  )
}

export function ArrowUpIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M8 13V3.5M3.75 7.75L8 3.5l4.25 4.25" />
    </Icon>
  )
}

export function FileIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M9 1.75H4.5a1 1 0 00-1 1v10.5a1 1 0 001 1h7a1 1 0 001-1V5.25z" />
      <path d="M9 1.75v3.5h3.5" />
    </Icon>
  )
}

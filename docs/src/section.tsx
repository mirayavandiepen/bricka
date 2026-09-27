import type { ReactNode } from 'react'

export function Section({
  id,
  title,
  lede,
  children,
}: {
  id: string
  title: string
  /** One or two plain sentences: what this is and why you'd use it. */
  lede?: ReactNode
  children: ReactNode
}) {
  return (
    <section id={id} className="section" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}>
        <a href={`#${id}`}>{title}</a>
      </h2>
      {lede && <p className="lede">{lede}</p>}
      {children}
    </section>
  )
}

import { useEffect, useRef, useState } from 'react'
import { Hero } from './hero'
import { LINKS } from './links'
import { NAV, NAV_GROUPS } from './nav'
import { Sections } from './sections'

function useActiveSection(ids: Array<string>): string {
  const [active, setActive] = useState(ids[0])
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-64px 0px -70% 0px' }
    )
    for (const id of ids) {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    }
    return () => observer.disconnect()
  }, [ids])
  return active
}

const NAV_IDS = NAV.map((item) => item.id)

function Navigation({ active }: { active: string }) {
  return (
    <>
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="nav-group">
          <p className="nav-group-label">{group.label}</p>
          <ul>
            {group.items.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  aria-current={item.id === active ? 'location' : undefined}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  )
}

/** Sections fade up once as they scroll into view. */
function useReveal() {
  useEffect(() => {
    const root = document.documentElement
    root.dataset.reveal = ''
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.setAttribute('data-shown', '')
          observer.unobserve(entry.target)
        }
      },
      { rootMargin: '0px 0px -8% 0px' }
    )
    for (const element of document.querySelectorAll('.section')) {
      observer.observe(element)
    }
    return () => {
      observer.disconnect()
      delete root.dataset.reveal
    }
  }, [])
}

/** The Contents menu acts like a dialog: a picked link, a tap outside or
    Escape closes it. */
function MobileNav({ active }: { active: string }) {
  const details = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    function close() {
      if (details.current) details.current.open = false
    }
    // A tap anywhere outside the menu closes it, and goes no further.
    function onClick(event: MouseEvent) {
      const element = details.current
      if (!element?.open) return
      const target = event.target as Node
      const menu = element.querySelector('nav')
      const summary = element.querySelector('summary')
      if (menu?.contains(target) || summary?.contains(target)) return
      event.preventDefault()
      close()
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape' || !details.current?.open) return
      close()
      details.current.querySelector('summary')?.focus()
    }
    document.addEventListener('click', onClick)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('click', onClick)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  return (
    <details className="mobile-nav" ref={details}>
      <summary>Contents</summary>
      <div className="mobile-nav-backdrop" aria-hidden />
      <nav
        aria-label="Contents"
        onClick={(event) => {
          if ((event.target as Element).closest('a')) {
            details.current?.removeAttribute('open')
          }
        }}
      >
        <Navigation active={active} />
      </nav>
    </details>
  )
}

export function App() {
  const active = useActiveSection(NAV_IDS)
  useReveal()

  return (
    <>
      <a className="skip-link" href="#content">
        Skip to content
      </a>
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href="#introduction">
            <span className="wordmark">bricka</span>
          </a>
          <nav className="topbar-links" aria-label="Project">
            <MobileNav active={active} />
            <a href={LINKS.npm}>npm</a>
            {LINKS.repository && <a href={LINKS.repository}>GitHub</a>}
            <a className="cta" href="#get-started">
              Install
            </a>
          </nav>
        </div>
      </header>
      <div className="layout">
        <nav className="sidebar" aria-label="Documentation">
          <Navigation active={active} />
        </nav>
        <main id="content" className="content">
          <Hero />
          <div className="docs">
            <Sections />
          </div>
          <footer className="footer">
            <span>MIT License</span>
            <span>Built by Miraya van Diepen</span>
          </footer>
        </main>
      </div>
    </>
  )
}

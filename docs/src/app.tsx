import { useEffect, useState } from 'react'
import { Hero } from './hero'
import { LINKS } from './links'
import { NAV, Sections } from './sections'
import { ThemeToggle } from './theme'

function Logo() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 32 32"
      aria-hidden
      className="logo"
    >
      <rect width="32" height="32" rx="7" fill="currentColor" />
      <rect
        x="7"
        y="14.5"
        width="4"
        height="3"
        rx="1.5"
        className="logo-text"
      />
      <rect
        x="13"
        y="12.5"
        width="8"
        height="7"
        rx="2"
        className="logo-token"
      />
      <rect
        x="23"
        y="14.5"
        width="2.5"
        height="3"
        rx="1.25"
        className="logo-text"
      />
    </svg>
  )
}

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
    <ul>
      {NAV.map((item) => (
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
  )
}

export function App() {
  const active = useActiveSection(NAV_IDS)

  return (
    <>
      <a className="skip-link" href="#content">
        Skip to content
      </a>
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href="#introduction">
            <Logo />
            <span>Inlay</span>
            <span className="version">v0.1</span>
          </a>
          <nav className="topbar-links" aria-label="Project">
            <details className="mobile-nav">
              <summary>Contents</summary>
              <nav aria-label="Contents">
                <Navigation active={active} />
              </nav>
            </details>
            <a href="#examples">Examples</a>
            <a href={LINKS.npm}>npm</a>
            {LINKS.repository && <a href={LINKS.repository}>GitHub</a>}
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <div className="layout">
        <nav className="sidebar" aria-label="Documentation">
          <Navigation active={active} />
        </nav>
        <main id="content" className="content">
          <Hero />
          <Sections />
          <footer className="footer">
            <span>MIT License</span>
            <span>Built by Miraya van Diepen</span>
          </footer>
        </main>
      </div>
    </>
  )
}

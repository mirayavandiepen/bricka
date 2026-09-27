import { useEffect, useState } from 'react'
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
            <details className="mobile-nav">
              <summary>Contents</summary>
              <nav aria-label="Contents">
                <Navigation active={active} />
              </nav>
            </details>
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

import { useEffect, useState } from 'react'
import type { HighlighterCore } from 'shiki/core'

export type Language = 'tsx' | 'ts' | 'css' | 'bash'

let highlighter: Promise<HighlighterCore> | null = null

function loadHighlighter(): Promise<HighlighterCore> {
  highlighter ??= Promise.all([
    import('shiki/core'),
    import('shiki/engine/javascript'),
  ]).then(([{ createHighlighterCore }, { createJavaScriptRegexEngine }]) =>
    createHighlighterCore({
      themes: [
        import('shiki/themes/github-light.mjs'),
        import('shiki/themes/github-dark-dimmed.mjs'),
      ],
      langs: [
        import('shiki/langs/tsx.mjs'),
        import('shiki/langs/typescript.mjs'),
        import('shiki/langs/css.mjs'),
        import('shiki/langs/shellscript.mjs'),
      ],
      engine: createJavaScriptRegexEngine(),
    })
  )
  return highlighter
}

const LANGUAGE_IDS: Record<Language, string> = {
  tsx: 'tsx',
  ts: 'typescript',
  css: 'css',
  bash: 'shellscript',
}

function useHighlighted(code: string, language: Language): string | null {
  const [html, setHtml] = useState<string | null>(null)
  useEffect(() => {
    let isCurrent = true
    void loadHighlighter().then((instance) => {
      if (!isCurrent) return
      setHtml(
        instance.codeToHtml(code, {
          lang: LANGUAGE_IDS[language],
          themes: { light: 'github-light', dark: 'github-dark-dimmed' },
          defaultColor: false,
        })
      )
    })
    return () => {
      isCurrent = false
    }
  }, [code, language])
  return html
}

export function CopyButton({
  text,
  label = 'Copy',
}: {
  text: string
  label?: string
}) {
  const [isCopied, setIsCopied] = useState(false)
  useEffect(() => {
    if (!isCopied) return
    const timer = setTimeout(() => setIsCopied(false), 1400)
    return () => clearTimeout(timer)
  }, [isCopied])

  return (
    <button
      type="button"
      className="copy-button"
      aria-label={isCopied ? 'Copied' : label}
      onClick={() => {
        void navigator.clipboard?.writeText(text).then(() => setIsCopied(true))
      }}
    >
      {isCopied ? (
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
          <path
            d="M3.5 8.5l3 3 6-7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
          <rect
            x="5.25"
            y="5.25"
            width="8"
            height="8"
            rx="1.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
          />
          <path
            d="M10.75 3.25a1.5 1.5 0 00-1.5-1.5h-5a1.5 1.5 0 00-1.5 1.5v5a1.5 1.5 0 001.5 1.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
          />
        </svg>
      )}
    </button>
  )
}

export function Code({
  children,
  language = 'tsx',
  title,
}: {
  children: string
  language?: Language
  title?: string
}) {
  const code = children.trim()
  const html = useHighlighted(code, language)
  return (
    <figure className="code">
      <figcaption className="code-header">
        <span>{title ?? language}</span>
        <CopyButton text={code} label="Copy code" />
      </figcaption>
      {html ? (
        <div className="code-body" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <div className="code-body">
          <pre>
            <code>{code}</code>
          </pre>
        </div>
      )}
    </figure>
  )
}

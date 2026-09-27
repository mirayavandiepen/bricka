/** Resolve after `ms`, or reject when the signal aborts. */
export function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    })
  })
}

/** Stream a string word by word, like a model would. */
export async function* streamWords(
  text: string,
  signal: AbortSignal,
  delay = 45
): AsyncGenerator<string> {
  for (const word of text.match(/\s*\S+/g) ?? []) {
    // Chunks are sequential by nature.
    // eslint-disable-next-line no-await-in-loop
    await wait(delay, signal)
    yield word
  }
}

type Completion = [pattern: RegExp, suggestions: Array<string>]

/** Pick canned continuations whose pattern matches the end of the text. */
export function complete(
  text: string,
  table: Array<Completion>
): Array<string> {
  for (const [pattern, suggestions] of table) {
    if (!pattern.test(text)) continue
    const shouldAddSpace = !/\s$/.test(text)
    return suggestions.map((suggestion) =>
      shouldAddSpace && !/^[\s,.?!]/.test(suggestion)
        ? ` ${suggestion}`
        : suggestion
    )
  }
  return []
}

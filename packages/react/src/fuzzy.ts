import type { ContextItem } from './types'

export type FuzzyMatch = {
  /** Lower is better. */
  score: number
  /** Matched character positions in the candidate. */
  indices: Array<number>
}

const BOUNDARY = /[\s\-_./\\:@#]/

function isBoundary(candidate: string, index: number): boolean {
  if (index === 0) return true
  const previous = candidate[index - 1]
  return BOUNDARY.test(previous)
}

/** Match a query against a candidate: substring first, then subsequence. */
export function fuzzyMatch(
  query: string,
  candidate: string
): FuzzyMatch | null {
  const needle = query.trim().toLowerCase()
  if (needle.length === 0) return { score: 0, indices: [] }
  const haystack = candidate.toLowerCase()
  const lengthPenalty = (haystack.length - needle.length) * 0.001

  const direct = haystack.indexOf(needle)
  if (direct !== -1) {
    let score = 2 + direct * 0.1
    if (direct === 0) score = 0
    else if (isBoundary(haystack, direct)) score = 1
    const indices = Array.from({ length: needle.length }, (_, i) => direct + i)
    return { score: score + lengthPenalty, indices }
  }

  const indices: Array<number> = []
  let cursor = 0
  let gaps = 0
  for (const char of needle) {
    const found = haystack.indexOf(char, cursor)
    if (found === -1) return null
    if (indices.length > 0) gaps += found - cursor
    indices.push(found)
    cursor = found + 1
  }
  const score = 100 + indices[0] * 3 + gaps * 2 + lengthPenalty
  return { score, indices }
}

function scoreItem(query: string, item: ContextItem): number | null {
  const label = fuzzyMatch(query, item.label)
  if (label) return label.score

  let best: number | null = null
  for (const keyword of item.keywords ?? []) {
    const match = fuzzyMatch(query, keyword)
    if (match && (best === null || match.score + 20 < best)) {
      best = match.score + 20
    }
  }
  if (best !== null) return best

  const needle = query.trim().toLowerCase()
  if (item.description?.toLowerCase().includes(needle)) return 300
  return null
}

/**
 * Filter items by label, keywords and description. Empty queries return
 * all items; ties keep their original order.
 */
export function fuzzyFilter<TItem extends ContextItem>(
  items: Array<TItem>,
  query: string
): Array<TItem> {
  if (query.trim().length === 0) return items.slice()

  const matches: Array<{ item: TItem; score: number; index: number }> = []
  items.forEach((item, index) => {
    const score = scoreItem(query, item)
    if (score !== null) matches.push({ item, score, index })
  })
  matches.sort((a, b) => a.score - b.score || a.index - b.index)
  return matches.map((match) => match.item)
}

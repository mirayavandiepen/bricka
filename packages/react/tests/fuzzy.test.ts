import { describe, expect, it } from 'vitest'
import { fuzzyFilter, fuzzyMatch } from '../src/fuzzy'

const items = [
  { id: '1', label: 'package.json' },
  { id: '2', label: 'Composer.tsx' },
  { id: '3', label: 'use-composer.ts' },
  { id: '4', label: 'README.md', keywords: ['docs'] },
  { id: '5', label: 'Design system', description: 'Tokens and components' },
]

describe('fuzzyFilter', () => {
  it('returns all items in order for an empty query', () => {
    expect(fuzzyFilter(items, '  ')).toEqual(items)
  })

  it('ranks prefix, then word boundary, then inner matches', () => {
    const ids = fuzzyFilter(items, 'comp').map((i) => i.id)
    expect(ids.slice(0, 2)).toEqual(['2', '3'])
  })

  it('matches subsequences case-insensitively after substrings', () => {
    expect(fuzzyFilter(items, 'pkjs').map((i) => i.id)).toEqual(['1'])
    expect(fuzzyFilter(items, 'CMP').map((i) => i.id)).toContain('2')
  })

  it('searches keywords and descriptions', () => {
    expect(fuzzyFilter(items, 'docs').map((i) => i.id)).toEqual(['4'])
    expect(fuzzyFilter(items, 'tokens').map((i) => i.id)).toEqual(['5'])
  })

  it('returns nothing when nothing matches', () => {
    expect(fuzzyFilter(items, 'zzz')).toEqual([])
  })

  it('keeps original order for equal scores', () => {
    const twins = [
      { id: 'a', label: 'alpha' },
      { id: 'b', label: 'alpha' },
    ]
    expect(fuzzyFilter(twins, 'al').map((i) => i.id)).toEqual(['a', 'b'])
  })

  it('stays fast for large lists', () => {
    const many = Array.from({ length: 20000 }, (_, i) => ({
      id: String(i),
      label: `src/components/file-${i}.tsx`,
    }))
    const start = performance.now()
    fuzzyFilter(many, 'file-19')
    expect(performance.now() - start).toBeLessThan(200)
  })
})

describe('fuzzyMatch', () => {
  it('returns matched indices for highlighting', () => {
    expect(fuzzyMatch('pos', 'Composer')?.indices).toEqual([3, 4, 5])
    expect(fuzzyMatch('cr', 'Composer')?.indices).toEqual([0, 7])
    expect(fuzzyMatch('x', 'Composer')).toBeNull()
  })
})

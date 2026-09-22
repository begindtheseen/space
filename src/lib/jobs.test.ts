import { describe, expect, it } from 'vitest'
import sample from './__fixtures__/greenhouse-sample.json'
import {
  describeCount,
  postedAgo,
  safeUrl,
  selectPostings,
  unseenPostings,
  type JobPosting,
} from './jobs'

const AT = '2026-09-22T05:00:00.000Z'

describe('selectPostings, against real board data', () => {
  const result = selectPostings(sample, AT)

  it('keeps only Hawthorne temporary postings', () => {
    expect(result.postings.map((p) => p.title).sort()).toEqual([
      'Material Handler (Starshield) - Temporary Position',
      'Recruiting Coordinator- Temporary (Hawthorne)',
    ])
  })

  it('counts every Hawthorne posting it considered, not just the matches', () => {
    // The UI says "2 of 4 Hawthorne postings", so this number has to be real.
    expect(result.hawthorneTotal).toBe(4)
  })

  it('drops temporary roles at other sites', () => {
    expect(result.postings.some((p) => p.location.includes('Bastrop'))).toBe(false)
    expect(result.postings.some((p) => p.location.includes('Canaveral'))).toBe(false)
  })

  it('drops permanent Hawthorne roles', () => {
    expect(result.postings.some((p) => p.title === 'Accountant')).toBe(false)
  })

  it('drops internships, which are not what she is watching for', () => {
    expect(result.postings.some((p) => p.employmentType === 'Intern')).toBe(false)
  })

  it('carries the fields the card needs', () => {
    const p = result.postings.find((x) => x.title.startsWith('Material Handler'))!
    expect(p.id).toMatch(/^\d+$/)
    expect(p.employmentType).toBe('Temporary')
    expect(p.location).toBe('Hawthorne, CA')
    expect(p.url).toMatch(/^https:\/\/boards\.greenhouse\.io\//)
    expect(p.firstPublished).toBeTruthy()
  })

  it('puts the newest posting first', () => {
    const dates = result.postings.map((p) => p.firstPublished ?? '')
    expect([...dates].sort().reverse()).toEqual(dates)
  })
})

describe('selectPostings, on bad input', () => {
  it('survives junk rather than throwing on a page she opened', () => {
    for (const junk of [null, undefined, 42, 'nope', {}, { jobs: 'no' }, { jobs: [null, 7] }]) {
      expect(selectPostings(junk, AT).postings).toEqual([])
    }
  })

  it('skips a posting with no id or no title', () => {
    const body = {
      jobs: [
        { id: 1, location: { name: 'Hawthorne, CA' }, metadata: [{ name: 'Employment Type', value: 'Temporary' }] },
        { title: 'No id', location: { name: 'Hawthorne, CA' }, metadata: [{ name: 'Employment Type', value: 'Temporary' }] },
      ],
    }
    expect(selectPostings(body, AT).postings).toEqual([])
  })

  it('keeps a Contract posting, labelled, rather than silently dropping it', () => {
    const body = {
      jobs: [
        {
          id: 9,
          title: 'Technician, Contract',
          location: { name: 'Hawthorne, CA' },
          metadata: [{ name: 'Employment Type', value: 'Contract' }],
        },
      ],
    }
    const out = selectPostings(body, AT).postings
    expect(out).toHaveLength(1)
    expect(out[0]!.employmentType).toBe('Contract')
  })

  it('matches the site case-insensitively and inside a longer string', () => {
    const body = {
      jobs: [
        {
          id: 5,
          title: 'Temp',
          location: { name: 'HAWTHORNE, CA (onsite)' },
          metadata: [{ name: 'Employment Type', value: 'Temporary' }],
        },
      ],
    }
    expect(selectPostings(body, AT).postings).toHaveLength(1)
  })
})

describe('safeUrl', () => {
  it('accepts the board hosts over https', () => {
    expect(safeUrl('https://boards.greenhouse.io/spacex/jobs/123')).toBeTruthy()
    expect(safeUrl('https://www.spacex.com/careers/')).toBeTruthy()
  })

  it('refuses anything else, because this ends up in a browser', () => {
    // The URL is third-party text behind a button that opens the system browser.
    expect(safeUrl('http://boards.greenhouse.io/x')).toBeUndefined()
    expect(safeUrl('https://evil.example.com/x')).toBeUndefined()
    expect(safeUrl('javascript:alert(1)')).toBeUndefined()
    expect(safeUrl('data:text/html,<script>')).toBeUndefined()
    expect(safeUrl('')).toBeUndefined()
    expect(safeUrl(null)).toBeUndefined()
  })

  it('is not fooled by a lookalike host', () => {
    expect(safeUrl('https://boards.greenhouse.io.evil.com/x')).toBeUndefined()
    expect(safeUrl('https://notboards.greenhouse.io/x')).toBeUndefined()
  })
})

describe('unseenPostings', () => {
  const posts: JobPosting[] = [
    { id: '1', title: 'A', employmentType: 'Temporary', location: 'Hawthorne, CA' },
    { id: '2', title: 'B', employmentType: 'Temporary', location: 'Hawthorne, CA' },
  ]

  it('returns the ones not yet recorded', () => {
    expect(unseenPostings(posts, {}).map((p) => p.id)).toEqual(['1', '2'])
    expect(unseenPostings(posts, { '1': AT }).map((p) => p.id)).toEqual(['2'])
    expect(unseenPostings(posts, { '1': AT, '2': AT })).toEqual([])
  })

  it('treats a repost with a new id as new, which it is', () => {
    const repost: JobPosting[] = [
      { id: '3', title: 'A', employmentType: 'Temporary', location: 'Hawthorne, CA' },
    ]
    expect(unseenPostings(repost, { '1': AT })).toHaveLength(1)
  })
})

describe('wording', () => {
  it('reads as a sentence at every count, including zero', () => {
    expect(describeCount(0)).toBe('no temporary openings at Hawthorne right now')
    expect(describeCount(1)).toBe('one temporary opening at Hawthorne')
    expect(describeCount(4)).toBe('4 temporary openings at Hawthorne')
  })

  it('says how long ago without false precision', () => {
    const now = new Date('2026-09-22T12:00:00Z')
    expect(postedAgo('2026-09-22T08:00:00Z', now)).toBe('posted today')
    expect(postedAgo('2026-09-21T08:00:00Z', now)).toBe('posted yesterday')
    expect(postedAgo('2026-09-12T08:00:00Z', now)).toBe('posted 10 days ago')
    expect(postedAgo('2026-08-12T08:00:00Z', now)).toBe('posted about a month ago')
    expect(postedAgo(undefined, now)).toBeUndefined()
    expect(postedAgo('not a date', now)).toBeUndefined()
  })
})

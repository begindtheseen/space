/* ============================================================================
   ORBIT — Hawthorne temporary postings
   ----------------------------------------------------------------------------
   A temporary req at Hawthorne is a way in. They are rare, they are not
   advertised any differently from the two and a half thousand other openings,
   and they are gone quickly. At the time this was written there were exactly
   two of them among 679 Hawthorne postings. Missing one is the default
   outcome, and this exists so that it is not.

   Where the data comes from: SpaceX's public Greenhouse job board, the same
   feed behind their careers page. It answers with `access-control-allow-origin: *`,
   so the app can read it directly without a server in the middle.

   How a posting is judged temporary: every job carries a `metadata` entry
   named "Employment Type", whose value is one of Regular, Temporary, Intern or
   Contract. That field is authoritative — checking the whole board for titles
   that say "temporary" while the field says "Regular" turned up nothing but
   false matches on words like "Internal". So the field is used, not the title.

   Contract postings are shown too, labelled as such. There are none at
   Hawthorne today, but a future one is far more like a temporary req than like
   a permanent one, and silently dropping it would be the exact failure this
   file exists to prevent.

   ── Trust ─────────────────────────────────────────────────────────────────
   Everything here is untrusted third-party text. Titles are rendered as text,
   never as markup; the job description HTML the feed carries is not rendered
   at all; and a posting's link is only offered when it is an https URL on a
   host known to belong to the board. A posting that fails any of that is
   dropped rather than shown half-trusted.
   ========================================================================== */

const BOARD_URL = 'https://boards-api.greenhouse.io/v1/boards/spacex/jobs?content=false'

/** Hosts a posting may link to. Anything else and the link is dropped. */
const LINK_HOSTS = new Set([
  'boards.greenhouse.io',
  'job-boards.greenhouse.io',
  'www.spacex.com',
  'spacex.com',
])

/** Employment types worth telling her about. */
const WANTED = new Set(['Temporary', 'Contract'])

/** Matched against `location.name`. */
const SITE = 'hawthorne'

export interface JobPosting {
  id: string
  title: string
  /** "Temporary" or "Contract", verbatim from the board. */
  employmentType: string
  /** e.g. "Hawthorne, CA". */
  location: string
  /** Team or discipline, when the board states one. */
  discipline?: string
  /** ISO timestamp the posting first appeared. */
  firstPublished?: string
  /** ISO timestamp it was last edited. */
  updatedAt?: string
  /** Vetted https link, or undefined when the feed gave something unusable. */
  url?: string
}

export interface JobsResult {
  postings: JobPosting[]
  /** ISO timestamp of this fetch. */
  fetchedAt: string
  /** How many Hawthorne postings were considered, for the "x of y" line. */
  hawthorneTotal: number
}

/* ── Fetching ────────────────────────────────────────────────────────────── */

export class JobsError extends Error {}

/**
 * Reads the board and returns the Hawthorne postings worth flagging.
 *
 * `content=false` keeps the response to a few hundred kilobytes instead of two
 * and a half megabytes: the description is not rendered anywhere, so there is
 * no reason to download it.
 */
export async function fetchHawthorneTemporary(signal?: AbortSignal): Promise<JobsResult> {
  let res: Response
  try {
    res = await fetch(BOARD_URL, { signal, headers: { accept: 'application/json' } })
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw err
    throw new JobsError(
      'Could not reach the SpaceX job board. That is usually no internet rather than anything wrong.',
    )
  }
  if (!res.ok) throw new JobsError(`The job board answered ${res.status}.`)

  let body: unknown
  try {
    body = await res.json()
  } catch {
    throw new JobsError('The job board sent something this app could not read.')
  }

  return selectPostings(body, new Date().toISOString())
}

/* ── Selection ───────────────────────────────────────────────────────────── */

/** Exported for testing: the pure part, with no network in it. */
export function selectPostings(body: unknown, fetchedAt: string): JobsResult {
  const jobs = Array.isArray((body as { jobs?: unknown })?.jobs)
    ? ((body as { jobs: unknown[] }).jobs)
    : []

  let hawthorneTotal = 0
  const postings: JobPosting[] = []

  for (const raw of jobs) {
    if (!raw || typeof raw !== 'object') continue
    const j = raw as Record<string, unknown>

    const location = str((j.location as Record<string, unknown> | undefined)?.name, 120)
    if (!location || !location.toLowerCase().includes(SITE)) continue
    hawthorneTotal++

    const meta = metaOf(j.metadata)
    const employmentType = meta.get('Employment Type')
    if (!employmentType || !WANTED.has(employmentType)) continue

    const title = str(j.title, 200)
    const id = idOf(j.id)
    if (!title || !id) continue

    postings.push({
      id,
      title,
      employmentType,
      location,
      discipline: meta.get('Discipline'),
      firstPublished: str(j.first_published, 40),
      updatedAt: str(j.updated_at, 40),
      url: safeUrl(j.absolute_url),
    })
  }

  // Newest first — a posting she has not seen is almost always a recent one.
  postings.sort((a, b) => (b.firstPublished ?? '').localeCompare(a.firstPublished ?? ''))
  return { postings, fetchedAt, hawthorneTotal }
}

function metaOf(value: unknown): Map<string, string> {
  const out = new Map<string, string>()
  if (!Array.isArray(value)) return out
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue
    const e = entry as Record<string, unknown>
    const name = str(e.name, 80)
    // Multi-select values arrive as arrays; only single values are used here.
    const val = typeof e.value === 'string' ? str(e.value, 120) : undefined
    if (name && val) out.set(name, val)
  }
  return out
}

function idOf(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return String(Math.trunc(value))
  if (typeof value === 'string' && /^[0-9]{1,20}$/.test(value)) return value
  return undefined
}

function str(value: unknown, max: number): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, max) : undefined
}

/**
 * An https link on a host the board actually uses, or nothing.
 *
 * The URL comes from a third party and ends up behind a button that opens the
 * system browser, so it is checked rather than trusted.
 */
export function safeUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.length > 2048) return undefined
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    return undefined
  }
  if (parsed.protocol !== 'https:') return undefined
  if (!LINK_HOSTS.has(parsed.hostname)) return undefined
  return parsed.href
}

/* ── What is new ─────────────────────────────────────────────────────────── */

/**
 * The postings she has not been shown yet.
 *
 * `seen` maps a posting id to when it was first noticed. Ids are used rather
 * than titles because SpaceX reposts the same title regularly, and a reposted
 * req is a genuinely new chance to apply.
 */
export function unseenPostings(
  postings: JobPosting[],
  seen: Record<string, string>,
): JobPosting[] {
  return postings.filter((p) => !seen[p.id])
}

/** How the count reads in a sentence, including the zero case. */
export function describeCount(n: number): string {
  if (n === 0) return 'no temporary openings at Hawthorne right now'
  if (n === 1) return 'one temporary opening at Hawthorne'
  return `${n} temporary openings at Hawthorne`
}

/** "posted 3 days ago", or nothing when the feed gave no date. */
export function postedAgo(iso: string | undefined, now: Date = new Date()): string | undefined {
  if (!iso) return undefined
  const then = new Date(iso).getTime()
  if (!Number.isFinite(then)) return undefined
  const days = Math.floor((now.getTime() - then) / 86_400_000)
  if (days <= 0) return 'posted today'
  if (days === 1) return 'posted yesterday'
  if (days < 30) return `posted ${days} days ago`
  const months = Math.floor(days / 30)
  return months === 1 ? 'posted about a month ago' : `posted about ${months} months ago`
}

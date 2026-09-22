/* ============================================================================
   ORBIT — Hawthorne watch
   ----------------------------------------------------------------------------
   One job: do not let a temporary requisition at Hawthorne go by unnoticed.

   These are rare. When this was written there were two of them among 679
   Hawthorne postings, and they do not stay up long. So the page is built
   around the two states that actually matter — something new is up, or nothing
   is — and it says which plainly rather than making her read a list to work it
   out.

   Everything shown here is third-party text from SpaceX's public job board.
   Titles are rendered as text, the description HTML is never fetched or
   rendered, and a link is only offered when it points at a host the board
   really uses. See src/lib/jobs.ts.
   ========================================================================== */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { IconBriefcase, IconCheck, IconWarn } from '@/components/icons'
import { Button, Card, CardHead, Chip } from '@/components/ui'
import { markJobsSeen } from '@/engine/apply'
import { useLearner } from '@/hooks/useLearner'
import { getOrbit } from '@/lib/desktop'
import {
  describeCount,
  fetchHawthorneTemporary,
  JobsError,
  postedAgo,
  unseenPostings,
  type JobPosting,
  type JobsResult,
} from '@/lib/jobs'
import './jobs.css'

export function Jobs() {
  const { state, setState } = useLearner()
  const [result, setResult] = useState<JobsResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const abortRef = useRef<AbortController | null>(null)

  // Frozen at mount so the "new" highlight does not vanish under her the
  // instant the page marks everything seen.
  const seenAtOpen = useRef(state.jobsSeen)

  const load = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    setError(null)
    try {
      const res = await fetchHawthorneTemporary(controller.signal)
      setResult(res)
      // Marked seen only once it is on screen — the record answers "has she
      // been told", so a background refresh must not answer it for her.
      setState((s) => markJobsSeen(s, res.postings.map((p) => p.id)))
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return
      setError(err instanceof JobsError ? err.message : 'Something went wrong reading the job board.')
    } finally {
      setLoading(false)
    }
  }, [setState])

  useEffect(() => {
    void load()
    return () => abortRef.current?.abort()
  }, [load])

  const fresh = useMemo(
    () => (result ? unseenPostings(result.postings, seenAtOpen.current) : []),
    [result],
  )
  const freshIds = useMemo(() => new Set(fresh.map((p) => p.id)), [fresh])

  return (
    <div className="page page--padtop">
      <div className="page-head">
        <div>
          <div className="page-head__kicker">Hawthorne watch</div>
          <h1 className="page-head__title">Temporary openings</h1>
          <p className="page-head__sub">
            Temporary requisitions at the Hawthorne site, and nothing else. They are uncommon and
            they do not stay up long, so this checks every time you open it. Read straight from
            SpaceX&rsquo;s own job board.
          </p>
        </div>
      </div>

      {fresh.length > 0 ? (
        <div className="jobs-new">
          <strong>
            {fresh.length === 1
              ? 'One opening you have not seen before.'
              : `${fresh.length} openings you have not seen before.`}
          </strong>{' '}
          Marked below.
        </div>
      ) : null}

      <Card index={0}>
        <CardHead
          icon={<IconBriefcase size={15} />}
          title={
            result
              ? describeCount(result.postings.length)
              : error
                ? 'Could not check the job board'
                : 'Checking the job board…'
          }
          divided
          right={
            <Button onClick={() => void load()} disabled={loading} variant="quiet">
              {loading ? 'Checking…' : 'Check again'}
            </Button>
          }
        />
        <div className="sect">
          {error ? (
            <p className="jobs-error">
              <IconWarn size={14} /> {error}
            </p>
          ) : loading && !result ? (
            <p className="jobs-empty">Reading the board…</p>
          ) : result && result.postings.length === 0 ? (
            <Nothing total={result.hawthorneTotal} checkedAt={state.jobsCheckedAt} />
          ) : result ? (
            <>
              <ul className="jobs-list">
                {result.postings.map((p) => (
                  <Posting key={p.id} posting={p} isNew={freshIds.has(p.id)} />
                ))}
              </ul>
              <p className="jobs-foot">
                Checked {result.postings.length} of {result.hawthorneTotal} Hawthorne postings.
                Internships and permanent roles are not shown.
              </p>
            </>
          ) : null}
        </div>
      </Card>
    </div>
  )
}

function Nothing({ total, checkedAt }: { total: number; checkedAt?: string }) {
  return (
    <div className="jobs-none">
      <p>
        <strong>Nothing temporary at Hawthorne right now.</strong> That is the usual answer — there
        are often none at all, and only a couple when there are.
      </p>
      <p className="jobs-none__sub">
        All {total} Hawthorne postings were checked{checkedAt ? ` (last looked ${when(checkedAt)})` : ''}.
        Worth opening this every few days rather than waiting for one to appear.
      </p>
    </div>
  )
}

function Posting({ posting, isNew }: { posting: JobPosting; isNew: boolean }) {
  const open = () => {
    if (!posting.url) return
    const orbit = getOrbit()
    if (orbit) void orbit.openExternal(posting.url)
    else window.open(posting.url, '_blank', 'noopener,noreferrer')
  }

  const ago = postedAgo(posting.firstPublished)

  return (
    <li className={isNew ? 'jobs-item is-new' : 'jobs-item'}>
      <div className="jobs-item__body">
        <div className="jobs-item__top">
          {isNew ? <Chip>New</Chip> : null}
          <Chip ghost>{posting.employmentType}</Chip>
          {posting.discipline ? <span className="jobs-item__disc">{posting.discipline}</span> : null}
        </div>
        {/* Rendered as text: this string comes from a third party. */}
        <h3 className="jobs-item__title">{posting.title}</h3>
        <p className="jobs-item__meta">
          {posting.location}
          {ago ? ` · ${ago}` : ''}
        </p>
      </div>
      {posting.url ? (
        <Button onClick={open} variant="primary">
          Apply
        </Button>
      ) : (
        <span className="jobs-item__nolink">
          <IconCheck size={11} /> no usable link
        </span>
      )}
    </li>
  )
}

function when(iso: string): string {
  const then = new Date(iso).getTime()
  if (!Number.isFinite(then)) return 'recently'
  const mins = Math.floor((Date.now() - then) / 60000)
  if (mins < 2) return 'just now'
  if (mins < 60) return `${mins} minutes ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return hours === 1 ? 'an hour ago' : `${hours} hours ago`
  const days = Math.floor(hours / 24)
  return days === 1 ? 'yesterday' : `${days} days ago`
}

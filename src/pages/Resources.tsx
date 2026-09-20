/* ============================================================================
   ORBIT — resources & formula bank
   ----------------------------------------------------------------------------
   Every book, course and paper cited anywhere in the curriculum, deduplicated
   and sorted free-first, plus every formula card in one scrollable reference.

   Free-first ordering is a position, not a default: the whole curriculum is
   designed to be completable without buying anything, and the list should make
   that visible rather than burying the free option under the paid one.
   ========================================================================== */
import { useMemo, useState } from 'react'
import { IconBook, IconSearch, IconSigma, IconX } from '@/components/icons'
import { Card, CardHead, Chip, Empty, Segmented, Stat } from '@/components/ui'
import { MODULES, TRACKS } from '@/curriculum'
import type { Resource, ResourceKind } from '@/curriculum/types'
import './pages.css'

type View = 'resources' | 'formulas'

interface DedupedResource extends Resource {
  /** Module titles that cite this resource. */
  usedBy: string[]
}

export function Resources() {
  const [view, setView] = useState<View>('resources')
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState<ResourceKind | 'all'>('all')

  const resources = useMemo(() => {
    const byKey = new Map<string, DedupedResource>()
    for (const m of MODULES) {
      for (const r of m.resources) {
        const key = `${r.title.toLowerCase()}|${(r.author ?? '').toLowerCase()}`
        const hit = byKey.get(key)
        if (hit) {
          if (!hit.usedBy.includes(m.title)) hit.usedBy.push(m.title)
          // Keep a URL if any citation had one.
          if (!hit.url && r.url) hit.url = r.url
        } else {
          byKey.set(key, { ...r, usedBy: [m.title] })
        }
      }
    }
    return [...byKey.values()].sort(
      (a, b) => Number(b.free) - Number(a.free) || b.usedBy.length - a.usedBy.length,
    )
  }, [])

  const formulas = useMemo(
    () =>
      MODULES.flatMap((m) =>
        (m.cards ?? [])
          .filter((c) => c.formula)
          .map((c) => ({ card: c, module: m.title, track: m.track, id: `${m.id}::${c.id}` })),
      ),
    [],
  )

  const kinds = useMemo(() => {
    const set = new Set<ResourceKind>()
    for (const r of resources) set.add(r.kind)
    return [...set].sort()
  }, [resources])

  const q = query.trim().toLowerCase()

  const shownResources = useMemo(
    () =>
      resources.filter((r) => {
        if (kind !== 'all' && r.kind !== kind) return false
        if (!q) return true
        return (
          r.title.toLowerCase().includes(q) ||
          (r.author ?? '').toLowerCase().includes(q) ||
          r.usedBy.some((u) => u.toLowerCase().includes(q))
        )
      }),
    [resources, kind, q],
  )

  const shownFormulas = useMemo(
    () =>
      formulas.filter(
        (f) =>
          !q ||
          f.card.front.toLowerCase().includes(q) ||
          f.card.back.toLowerCase().includes(q) ||
          f.module.toLowerCase().includes(q),
      ),
    [formulas, q],
  )

  const freeCount = resources.filter((r) => r.free).length

  return (
    <div className="page page--padtop">
      <div className="page-head">
        <div style={{ minWidth: 0 }}>
          <div className="page-head__kicker">
            <IconBook size={13} />
            {resources.length} sources · {freeCount} free · {formulas.length} formulas
          </div>
          <h1 className="h-page">Reference</h1>
          <p className="page-head__sub">
            Everything the curriculum cites, in one place. {freeCount} of {resources.length} sources
            are free — this is studiable end to end without buying a single book, and the ordering
            reflects that.
          </p>
        </div>
      </div>

      <div className="summary" style={{ marginTop: 0 }}>
        <Card pad index={0}>
          <Stat value={resources.length} label="Sources cited" />
        </Card>
        <Card pad index={1}>
          <Stat value={freeCount} label="Free" deltaTone="ok" />
        </Card>
        <Card pad index={2}>
          <Stat value={resources.length - freeCount} label="Paid" />
        </Card>
        <Card pad index={3}>
          <Stat value={formulas.length} label="Formulas" />
        </Card>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: 'var(--gap)',
        }}
      >
        <Segmented
          value={view}
          options={[
            { value: 'resources', label: 'Sources' },
            { value: 'formulas', label: 'Formula bank' },
          ]}
          onChange={setView}
        />

        {view === 'resources' && kinds.length > 1 ? (
          <div className="seg" role="tablist">
            <button
              className="seg__btn"
              data-on={kind === 'all'}
              onClick={() => setKind('all')}
              type="button"
            >
              All
            </button>
            {kinds.map((k) => (
              <button
                key={k}
                className="seg__btn"
                data-on={kind === k}
                onClick={() => setKind(k)}
                type="button"
              >
                {k}
              </button>
            ))}
          </div>
        ) : null}

        <label className="search grow">
          <IconSearch size={15} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={view === 'resources' ? 'Search titles, authors…' : 'Search formulas…'}
            aria-label="Search reference"
          />
          {query ? (
            <button onClick={() => setQuery('')} aria-label="Clear search" type="button">
              <IconX size={14} />
            </button>
          ) : null}
        </label>
      </div>

      {view === 'resources' ? (
        shownResources.length === 0 ? (
          <Empty icon={<IconBook size={28} />} title="Nothing matches that" />
        ) : (
          <Card index={0}>
            <CardHead
              icon={<IconBook size={15} />}
              title={`${shownResources.length} sources`}
              divided
            />
            <div className="sect">
              {shownResources.map((r, i) => (
                <div className="rsrc" key={`${r.title}-${i}`}>
                  <span className="rsrc__kind">{r.kind}</span>
                  <div className="grow">
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, flexWrap: 'wrap' }}>
                      {r.url ? (
                        <a
                          className="rsrc__title"
                          href={r.url}
                          target="_blank"
                          rel="noreferrer noopener"
                        >
                          {r.title}
                        </a>
                      ) : (
                        <span className="rsrc__title">{r.title}</span>
                      )}
                      {r.free ? <Chip tone="ok">free</Chip> : <Chip ghost>paid</Chip>}
                    </div>
                    <div className="rsrc__by">
                      {r.author ? `${r.author} · ` : ''}
                      used in {r.usedBy.length} module{r.usedBy.length === 1 ? '' : 's'}
                      {r.note ? ` · ${r.note}` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )
      ) : shownFormulas.length === 0 ? (
        <Empty
          icon={<IconSigma size={28} />}
          title="No formulas match that"
          body="The formula bank collects every flashcard in the curriculum whose answer is an equation."
        />
      ) : (
        <Card index={0}>
          <CardHead
            icon={<IconSigma size={15} />}
            title={`${shownFormulas.length} formulas`}
            divided
          />
          <div className="sect">
            {shownFormulas.map((f) => (
              <div className="formula" key={f.id}>
                <div className="formula__name">{f.card.front}</div>
                <div className="formula__body">{f.card.back}</div>
                <div className="formula__from">
                  {f.module}
                  <span style={{ color: TRACKS[f.track].accent, marginLeft: 7 }}>
                    {TRACKS[f.track].title}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <p className="track-note">
        Links open on the publishers' own sites. Availability and pricing change — if a link is dead,
        the title and author are enough to find it.
      </p>
    </div>
  )
}

/* ============================================================================
   ORBIT — settings
   ----------------------------------------------------------------------------
   Backup is at the top, not the bottom. This app stores everything on one
   device with no account behind it, so an export is the only thing standing
   between a learner and losing a year of scheduling state — burying it under
   theme preferences would be dishonest.
   ========================================================================== */
import { useEffect, useRef, useState } from 'react'
import {
  IconCheck,
  IconDownload,
  IconGear,
  IconRecall,
  IconShield,
  IconTarget,
  IconTrash,
  IconUpload,
  IconWarn,
} from '@/components/icons'
import { Button, Card, CardHead, Chip } from '@/components/ui'
import { UpdatesCard } from '@/components/UpdatesCard'
import { corpusStats } from '@/curriculum'
import { DEFAULT_W } from '@/engine/fsrs'
import { newLearnerState } from '@/engine/state'
import {
  clearAll,
  downloadBackup,
  parseBackup,
  requestPersistence,
  storageEstimate,
  type StorageEstimate,
} from '@/engine/store'
import { useLearner } from '@/hooks/useLearner'
import { isDesktop } from '@/lib/desktop'
import { CHANGELOG, notesForVersion } from '@/lib/changelog'
import { formatBytes } from '@/lib/format'
import { Markdown } from '@/lib/markdown'
import { DEFAULT_SPEECH_RATE, speechRateOptions } from '@/lib/speech'
import './pages.css'

export function Settings() {
  const { state, setState } = useLearner()
  const [storage, setStorage] = useState<StorageEstimate | null>(null)
  const [notice, setNotice] = useState<{ tone: 'ok' | 'bad'; text: string } | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const fileRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    void storageEstimate().then(setStorage)
  }, [state.updatedAt])

  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(null), 6000)
    return () => clearTimeout(t)
  }, [notice])

  const stats = corpusStats()
  const items = Object.keys(state.items).length
  const custom = !!state.settings.weights && state.settings.weights.some((w, i) => w !== DEFAULT_W[i])

  const onRestore = async (file: File) => {
    const text = await file.text()
    const result = parseBackup(text)
    if (!result.ok) {
      setNotice({ tone: 'bad', text: result.error })
      return
    }
    setState(result.state)
    setNotice({
      tone: 'ok',
      text: `Restored ${Object.keys(result.state.items).length} items and ${result.state.attempts.length} logged attempts.`,
    })
  }

  return (
    <div className="page page--padtop">
      <div className="page-head">
        <div>
          <div className="page-head__kicker">
            <IconGear size={13} />
            Local-first · no account · no server
          </div>
          <h1 className="h-page">Settings</h1>
          <p className="page-head__sub">
            Everything you do lives in this browser on this device. Nothing is uploaded, which also
            means nothing is recoverable if site data is cleared without an export.
          </p>
        </div>
      </div>

      {notice ? (
        <Card index={0} style={{ marginBottom: 'var(--gap)' }}>
          <div className="signal">
            <span
              className="signal__dot"
              style={{ background: notice.tone === 'ok' ? 'var(--ok)' : 'var(--bad)' }}
            />
            <div className="signal__msg">{notice.text}</div>
          </div>
        </Card>
      ) : null}

      <div className="read">
        <div className="stack">
          {/* ── backup ────────────────────────────────────────────────── */}
          <Card index={0}>
            <CardHead
              icon={<IconShield size={15} />}
              title="Backup & restore"
              right={<Chip tone={items > 0 ? 'warn' : 'default'}>{items} items</Chip>}
              divided
            />
            <div className="setting">
              <div className="grow">
                <div className="setting__label">Export a backup</div>
                <p className="setting__help">
                  A single JSON file containing your scheduling state, review history and settings.
                  Keep a copy somewhere that is not this device — that file is the durable version
                  of your progress.
                </p>
              </div>
              <div className="setting__control">
                <Button variant="primary" size="md" onClick={() => downloadBackup(state)}>
                  <IconDownload size={15} />
                  Export
                </Button>
              </div>
            </div>

            <div className="setting">
              <div className="grow">
                <div className="setting__label">Restore from a backup</div>
                <p className="setting__help">
                  Replaces everything currently stored. Malformed files are rejected rather than
                  partially applied.
                </p>
              </div>
              <div className="setting__control">
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/json,.json"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) void onRestore(f)
                    e.target.value = ''
                  }}
                />
                <Button variant="ghost" size="md" onClick={() => fileRef.current?.click()}>
                  <IconUpload size={15} />
                  Choose file
                </Button>
              </div>
            </div>

            <div className="setting">
              <div className="grow">
                <div className="setting__label">Storage</div>
                <p className="setting__help">
                  {storage
                    ? `${formatBytes(storage.usedBytes)} used of ${formatBytes(storage.quotaBytes)} available. ${
                        storage.persisted
                          ? 'This origin is marked persistent, so the browser will not evict it under disk pressure.'
                          : 'Not marked persistent — the browser may evict this data if the device runs low on space.'
                      }`
                    : 'Storage estimates are not available in this browser.'}
                </p>
              </div>
              {storage && !storage.persisted ? (
                <div className="setting__control">
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() =>
                      void requestPersistence().then(async (ok) => {
                        setStorage(await storageEstimate())
                        setNotice(
                          ok
                            ? { tone: 'ok', text: 'Storage is now persistent.' }
                            : { tone: 'bad', text: 'The browser declined. Safari ignores this request entirely — export regularly instead.' },
                        )
                      })
                    }
                  >
                    Request persistence
                  </Button>
                </div>
              ) : null}
            </div>
          </Card>

          {/* ── updates (desktop shell only) ──────────────────────────── */}
          {isDesktop ? <UpdatesCard index={1} /> : null}

          <WhatsNew index={isDesktop ? 2 : 1} />

          {/* ── scheduling ────────────────────────────────────────────── */}
          <Card index={1}>
            <CardHead icon={<IconRecall size={15} />} title="Scheduling" divided />

            <div className="setting">
              <div className="grow">
                <div className="setting__label">
                  Target retention — {Math.round(state.settings.desiredRetention * 100)}%
                </div>
                <p className="setting__help">
                  How much you want to remember when an item comes due. This is far more sensitive
                  than it looks: dropping from 90% to 80% roughly triples every interval, and
                  raising it to 95% cuts them by 60%. 90% is the balance point between workload and
                  retention, and is where the default sits.
                </p>
              </div>
              <div className="setting__control">
                <input
                  className="range"
                  type="range"
                  min={0.8}
                  max={0.95}
                  step={0.01}
                  value={state.settings.desiredRetention}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      settings: { ...s.settings, desiredRetention: Number(e.target.value) },
                    }))
                  }
                  aria-label="Target retention"
                />
              </div>
            </div>

            <Toggle
              label="Ask for confidence before revealing"
              help="Captures a judgement of learning before you see the answer. This is what makes the calibration chart on the Progress page possible, and seeing your own overconfidence plotted is the single most useful thing this app can show you."
              value={state.settings.askConfidence}
              onChange={(v) =>
                setState((s) => ({ ...s, settings: { ...s.settings, askConfidence: v } }))
              }
            />

            <Toggle
              label="Interleave topics within a session"
              help="Mixes related-but-confusable material instead of blocking it. It feels worse during the session and produces substantially better retention a day later. Brand-new material is still blocked until you have a few successes on it."
              value={state.settings.interleave}
              onChange={(v) =>
                setState((s) => ({ ...s, settings: { ...s.settings, interleave: v } }))
              }
            />

            <Toggle
              label="Fuzz review intervals"
              help="Jitters each interval by a few percent so a heavy study day does not create a permanent spike in your queue months later."
              value={state.settings.fuzz}
              onChange={(v) => setState((s) => ({ ...s, settings: { ...s.settings, fuzz: v } }))}
            />

            <Toggle
              label="Reduce motion"
              help="Stops the star drift, the card entrance animations and the counting rings. Your system's own reduced-motion setting is always respected regardless of this."
              value={state.settings.reduceMotion}
              onChange={(v) =>
                setState((s) => ({ ...s, settings: { ...s.settings, reduceMotion: v } }))
              }
            />

            <Toggle
              label="Keep the menu on screen"
              help="The navigation rail hides itself and comes back when you move the pointer to the left edge of the window. It is hidden by default so that the nearest way out of a lesson is the back link at the top of it, rather than a list of everywhere else you could be. Turn this on to keep the rail in view the whole time."
              value={state.settings.pinSidebar === true}
              onChange={(v) =>
                setState((s) => ({ ...s, settings: { ...s.settings, pinSidebar: v } }))
              }
            />

            <div className="setting">
              <div className="grow">
                <div className="setting__label">
                  Reading speed — {state.settings.speechRate ?? DEFAULT_SPEECH_RATE}×
                </div>
                <p className="setting__help">
                  How fast a lesson is read aloud. The same picker sits above any lesson that can
                  be read, and whichever you set last is the one you keep — it is remembered
                  between sessions rather than starting over at normal speed each time.
                </p>
              </div>
              <div className="setting__control">
                <select
                  className="select"
                  value={String(state.settings.speechRate ?? DEFAULT_SPEECH_RATE)}
                  aria-label="Reading speed"
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      settings: { ...s.settings, speechRate: Number(e.target.value) },
                    }))
                  }
                >
                  {speechRateOptions(state.settings.speechRate ?? DEFAULT_SPEECH_RATE).map((r) => (
                    <option key={r} value={String(r)}>
                      {r}×
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {custom ? (
              <div className="setting">
                <div className="grow">
                  <div className="setting__label">Custom FSRS parameters in use</div>
                  <p className="setting__help">
                    Your weight vector differs from the shipped defaults. Below roughly 1,000
                    reviews the defaults usually win — reset if you are unsure where these came
                    from.
                  </p>
                </div>
                <div className="setting__control">
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() =>
                      setState((s) => ({
                        ...s,
                        settings: { ...s.settings, weights: undefined },
                      }))
                    }
                  >
                    Reset to defaults
                  </Button>
                </div>
              </div>
            ) : null}
          </Card>

          {/* ── goals ─────────────────────────────────────────────────── */}
          <Card index={2}>
            <CardHead icon={<IconTarget size={15} />} title="Goals" divided />

            <div className="setting">
              <div className="grow">
                <div className="setting__label">Weekly study target</div>
                <p className="setting__help">
                  Weekly rather than daily on purpose. A daily target fails on the first busy day
                  and turns an otherwise good week into a felt failure; a weekly one absorbs the
                  variance.
                </p>
              </div>
              <div className="setting__control">
                <input
                  className="input"
                  type="number"
                  min={0}
                  max={10080}
                  step={30}
                  value={state.goals.weeklyMinutes}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      goals: { ...s.goals, weeklyMinutes: clampInt(e.target.value, 0, 10080) },
                    }))
                  }
                  aria-label="Weekly minutes"
                />
                <span style={{ fontSize: 11.5, color: 'var(--ink-4)' }}>min</span>
              </div>
            </div>

            <div className="setting">
              <div className="grow">
                <div className="setting__label">New items per day</div>
                <p className="setting__help">
                  Every new item becomes a permanent review obligation. Twelve a day is roughly 90
                  reviews a day at steady state — raise it knowingly.
                </p>
              </div>
              <div className="setting__control">
                <input
                  className="input"
                  type="number"
                  min={0}
                  max={200}
                  value={state.goals.newPerDay}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      goals: { ...s.goals, newPerDay: clampInt(e.target.value, 0, 200) },
                    }))
                  }
                  aria-label="New items per day"
                />
              </div>
            </div>

            <div className="setting">
              <div className="grow">
                <div className="setting__label">Target date (optional)</div>
                <p className="setting__help">
                  An interview or deadline. When set, intervals tighten and target retention climbs
                  as the date approaches, so the last review lands close enough to matter.
                </p>
              </div>
              <div className="setting__control">
                <input
                  className="input"
                  type="date"
                  value={state.goals.targetDate ?? ''}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      goals: { ...s.goals, targetDate: e.target.value || undefined },
                    }))
                  }
                  aria-label="Target date"
                />
              </div>
            </div>

            <div className="setting">
              <div className="grow">
                <div className="setting__label">When and where you study</div>
                <p className="setting__help">
                  A cue-based plan — “after I pour my coffee, at the kitchen table” — beats a
                  reminder time. Context stability is what actually drives a habit to automatic, and
                  that takes about two months, not three weeks.
                </p>
              </div>
            </div>
            <div className="setting" style={{ paddingTop: 0 }}>
              <input
                className="input input--wide grow"
                placeholder="After I…"
                value={state.goals.cue ?? ''}
                onChange={(e) =>
                  setState((s) => ({ ...s, goals: { ...s.goals, cue: e.target.value.slice(0, 120) } }))
                }
                aria-label="Study cue"
              />
              <input
                className="input"
                placeholder="Where"
                value={state.goals.place ?? ''}
                onChange={(e) =>
                  setState((s) => ({ ...s, goals: { ...s.goals, place: e.target.value.slice(0, 60) } }))
                }
                aria-label="Study place"
              />
            </div>
          </Card>

          {/* ── danger ────────────────────────────────────────────────── */}
          <Card index={3} style={{ borderColor: 'rgba(244,97,78,0.22)' }}>
            <CardHead icon={<IconWarn size={15} />} title="Danger zone" divided />
            <div className="setting">
              <div className="grow">
                <div className="setting__label">Erase everything</div>
                <p className="setting__help">
                  Deletes all progress, review history and settings from this device. There is no
                  undo and no server copy. Export first.
                </p>
              </div>
              <div className="setting__control">
                {confirmReset ? (
                  <>
                    <Button
                      variant="danger"
                      size="md"
                      onClick={() =>
                        void clearAll().then(() => {
                          setState(newLearnerState())
                          setConfirmReset(false)
                          setNotice({ tone: 'ok', text: 'Everything erased.' })
                        })
                      }
                    >
                      <IconTrash size={15} />
                      Yes, erase it
                    </Button>
                    <Button variant="ghost" size="md" onClick={() => setConfirmReset(false)}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button variant="danger" size="md" onClick={() => setConfirmReset(true)}>
                    <IconTrash size={15} />
                    Erase
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* ── right rail ────────────────────────────────────────────── */}
        <div className="stack">
          <Card index={0}>
            <CardHead icon={<IconGear size={15} />} title="You" divided />
            <div className="sect">
              <label className="setting__label" htmlFor="displayName">
                Display name
              </label>
              <input
                id="displayName"
                className="input input--wide"
                style={{ width: '100%', marginTop: 9 }}
                value={state.settings.displayName}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    settings: { ...s.settings, displayName: e.target.value.slice(0, 60) },
                  }))
                }
                placeholder="Future Engineer"
              />
              <p className="setting__help" style={{ marginTop: 9 }}>
                Shown on the dashboard. Stored only on this device.
              </p>
            </div>
          </Card>

          <Card index={1}>
            <CardHead icon={<IconCheck size={15} />} title="What is installed" divided />
            <div className="sect" style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 2 }}>
              <div>{stats.modules} modules</div>
              <div>{stats.cards.toLocaleString()} flashcards</div>
              <div>{stats.quiz.toLocaleString()} questions</div>
              <div>{stats.exercises} exercises</div>
              <div>{stats.resources} cited sources</div>
              <div>{Math.round(stats.hours).toLocaleString()} estimated study hours</div>
            </div>
          </Card>

          <Card index={2}>
            <CardHead icon={<IconShield size={15} />} title="Privacy" divided />
            <div className="sect" style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.75 }}>
              There is no account, no analytics and no network call carrying anything you do. The
              only outbound requests this app makes are for web fonts and, if you open the
              playground, the Python and SQLite runtimes — both from public CDNs, both cached after
              the first load.
            </div>
          </Card>

          <Card index={3}>
            <CardHead icon={<IconRecall size={15} />} title="About the scheduler" divided />
            <div className="sect" style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.75 }}>
              Reviews are scheduled by FSRS-6, a fitted power-law memory model with per-item
              stability and difficulty. Mastery blends that with a Bayesian estimate of whether you
              can actually do the thing, and item difficulty self-calibrates from your attempts. The
              Progress page shows all of it rather than hiding it behind a score.
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

/* ── Bits ────────────────────────────────────────────────────────────────── */

function Toggle({
  label,
  help,
  value,
  onChange,
}: {
  label: string
  help: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="setting">
      <div className="grow">
        <div className="setting__label">{label}</div>
        <p className="setting__help">{help}</p>
      </div>
      <div className="setting__control">
        <button
          className="toggle"
          data-on={value}
          onClick={() => onChange(!value)}
          role="switch"
          aria-checked={value}
          aria-label={label}
          type="button"
        />
      </div>
    </div>
  )
}

function clampInt(v: string, lo: number, hi: number): number {
  const n = Math.round(Number(v))
  if (!Number.isFinite(n)) return lo
  return Math.min(Math.max(n, lo), hi)
}

/**
 * What the version she is running changed.
 *
 * The update panel above answers this for a version she has not installed
 * yet. This answers it for the one she has — which is the half that was
 * missing, and the half that matters once the update is done and the panel
 * has gone back to saying she is up to date.
 */
function WhatsNew({ index }: { index: number }) {
  const version = __APP_VERSION__
  const current = notesForVersion(version)
  const earlier = CHANGELOG.filter((e) => e.version !== version).slice(0, 3)
  const [open, setOpen] = useState(false)

  return (
    <Card index={index}>
      <CardHead icon={<IconCheck size={15} />} title={`What's new in ${version}`} divided />
      <div className="sect">
        {current ? (
          <Markdown className="updates__notes">{current}</Markdown>
        ) : (
          <p className="setting__help">
            Nothing was written down for this version. That is a gap in the changelog rather than a
            version that changed nothing.
          </p>
        )}
      </div>

      {earlier.length ? (
        <div className="sect">
          <Button variant="ghost" size="md" onClick={() => setOpen((v) => !v)}>
            {open ? 'Hide earlier versions' : `Earlier versions (${earlier.length})`}
          </Button>
          {open
            ? earlier.map((e) => (
                <div key={e.version} style={{ marginTop: 14 }}>
                  <div className="setting__label">{e.version}</div>
                  <Markdown className="updates__notes">{e.notes}</Markdown>
                </div>
              ))
            : null}
        </div>
      ) : null}
    </Card>
  )
}

/* ============================================================================
   ORBIT — desktop updates card
   ----------------------------------------------------------------------------
   Shown on the Settings page only inside the Electron shell. The shell swaps
   the curriculum bundle underneath a stable app://orbit origin, which is why
   an update is a download and a restart rather than a reinstall — and why
   nothing here goes anywhere near learner data.
   ========================================================================== */
import { useEffect, useState, type FormEvent } from 'react'
import { IconDownload, IconRefresh } from '@/components/icons'
import { Bar, Button, Card, CardHead, Chip } from '@/components/ui'
import { useUpdates } from '@/hooks/useUpdates'
import { TOKEN_PATTERN, TOKEN_RULE, getOrbit, type UpdateStatus } from '@/lib/desktop'
import { formatBytes, formatDate, formatRelativeTime } from '@/lib/format'
import { Markdown } from '@/lib/markdown'
import '@/pages/pages.css'

const TOKEN_URL = 'https://github.com/settings/personal-access-tokens/new'

type ChipTone = 'default' | 'ok' | 'warn' | 'bad'

export function UpdatesCard({ index }: { index?: number }) {
  const orbit = getOrbit()
  const { state, busy, check, download, apply, rollback, setToken } = useUpdates()
  const [draft, setDraft] = useState('')
  const [tokenError, setTokenError] = useState<string | null>(null)
  const [confirmRollback, setConfirmRollback] = useState(false)
  const [relaunching, setRelaunching] = useState<'apply' | 'rollback' | null>(null)

  useMinuteTick(state?.checkedAt)

  useEffect(() => {
    if (!state?.canRollback) setConfirmRollback(false)
  }, [state?.canRollback])

  if (!orbit) return null

  const { versions } = orbit
  const status: UpdateStatus = state?.status ?? 'idle'
  const current = state?.current ?? versions.bundle
  const shell = state?.shell ?? versions.shell
  const repo = state?.repo ?? ''
  const latest = state?.latest
  const checked = state?.checkedAt ? formatRelativeTime(state.checkedAt) : null
  const chip = chipFor(status, current)

  const openExternal = (url: string) => {
    orbit.openExternal(url).catch(() => {
      // The shell's window-open guard routes https: to the system browser too.
      window.open(url, '_blank', 'noopener')
    })
  }

  const onSaveToken = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const token = draft.trim()
    if (!TOKEN_PATTERN.test(token)) {
      setTokenError(TOKEN_RULE)
      return
    }
    setTokenError(null)
    const wasAskedFor = state?.needsToken === true
    const next = await setToken(token)
    if (!next?.hasToken) return
    setDraft('')
    // A failed check asked for this token, so finish the job it was for.
    if (wasAskedFor) await check()
  }

  const onRestart = async () => {
    setRelaunching('apply')
    await apply()
    // Still mounted, so the shell declined; the reason is now in `state`.
    setRelaunching(null)
  }

  const onRollback = async () => {
    setRelaunching('rollback')
    await rollback()
    setRelaunching(null)
    setConfirmRollback(false)
  }

  const received = state?.progress?.received ?? 0
  const total = state?.progress?.total ?? latest?.size ?? 0
  const shellUrl = latest?.shellDownloadUrl
  const published = latest ? formatDate(latest.publishedAt) : null

  return (
    <Card index={index}>
      <CardHead
        icon={<IconRefresh size={15} />}
        title="Updates"
        right={<Chip tone={chip.tone}>{chip.label}</Chip>}
        divided
      />

      <div className="setting">
        <div className="grow">
          <div className="setting__label">Installed</div>
          <p className="setting__help">
            Curriculum bundle {current} · App {shell}
            <br />
            {checked ? `Checked ${checked}` : 'Not checked yet'}
          </p>
        </div>
        <div className="setting__control">
          <Button
            variant="primary"
            size="md"
            onClick={() => void check()}
            disabled={busy || state === null}
          >
            <IconRefresh size={15} />
            {status === 'checking' ? 'Checking…' : 'Check for updates'}
          </Button>
        </div>
      </div>

      {status === 'available' && latest ? (
        <div className="setting">
          <div className="grow">
            <div className="setting__label">Version {latest.version} is ready to download</div>
            <ReleaseNotes notes={latest.notes} />
            <div className="updates__meta">
              {formatBytes(latest.size)}
              {published ? ` · published ${published}` : ''}
            </div>
          </div>
          <div className="setting__control">
            <Button variant="primary" size="md" onClick={() => void download()} disabled={busy}>
              <IconDownload size={15} />
              Download
            </Button>
          </div>
        </div>
      ) : null}

      {status === 'downloading' ? (
        <div className="setting">
          <div className="grow">
            <div className="setting__label">Downloading {latest ? `version ${latest.version}` : 'the update'}…</div>
            <div className="updates__progress">
              <Bar value={total > 0 ? received / total : 0} />
              <div className="updates__meta">
                {formatBytes(received)} of {formatBytes(total)}
              </div>
            </div>
          </div>
          <div className="setting__control">
            <Button variant="primary" size="md" disabled>
              Downloading…
            </Button>
          </div>
        </div>
      ) : null}

      {status === 'ready' ? (
        <div className="setting">
          <div className="grow">
            <div className="setting__label">Downloaded</div>
            <p className="setting__help">
              ORBIT needs to restart to switch to {latest ? `version ${latest.version}` : 'the new version'}.
              Your progress lives in the app's own storage, not inside the bundle, so it comes along
              unchanged.
            </p>
            {state?.error ? (
              // A later check failed; the verified download stays applicable.
              <div className="updates__status updates__status--bad">
                <span className="signal__dot" />
                <span>{state.error}</span>
              </div>
            ) : null}
          </div>
          <div className="setting__control">
            <Button
              variant="primary"
              size="md"
              onClick={() => void onRestart()}
              disabled={busy || relaunching !== null}
            >
              {relaunching === 'apply' ? 'Restarting…' : 'Restart now'}
            </Button>
          </div>
        </div>
      ) : null}

      {status === 'shell-required' && latest ? (
        <div className="setting">
          <div className="grow">
            <div className="setting__label">Version {latest.version} needs a newer ORBIT app</div>
            <p className="setting__help">
              This update needs a newer ORBIT app ({latest.minShell}+). A bundle only carries the
              curriculum; the app around it ships as its own download, and your progress stays where
              it is when you install one.
            </p>
          </div>
          <div className="setting__control">
            {shellUrl ? (
              <Button variant="primary" size="md" onClick={() => openExternal(shellUrl)}>
                <IconDownload size={15} />
                Download new app
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="md"
                onClick={() => openExternal(`https://github.com/${repo}/releases`)}
                disabled={repo === ''}
              >
                Open releases
              </Button>
            )}
          </div>
        </div>
      ) : null}

      {status === 'error' ? (
        <div className="setting">
          <div className="grow">
            <div className="setting__label">Something went wrong</div>
            <div className="updates__status updates__status--bad">
              <span className="signal__dot" />
              <span>{state?.error || 'The updater reported an error without saying what.'}</span>
            </div>
          </div>
          <div className="setting__control">
            <Button variant="primary" size="md" onClick={() => void check()} disabled={busy}>
              Try again
            </Button>
          </div>
        </div>
      ) : null}

      <div className="setting">
        <div className="grow">
          <div className="setting__label">Access token</div>
          {state?.needsToken ? (
            <div className="updates__status updates__status--warn">
              <span className="signal__dot" />
              <span>
                GitHub would not show a release without one. Save a token here and the check runs
                again.
              </span>
            </div>
          ) : null}
          <p className="setting__help">
            Only needed while the GitHub repository is private. Create a{' '}
            <a
              className="updates__link"
              href={TOKEN_URL}
              onClick={(e) => {
                e.preventDefault()
                openExternal(TOKEN_URL)
              }}
            >
              fine-grained token
            </a>{' '}
            with read-only Contents access{repo ? ` for ${repo}` : ''}. It is kept on this device and
            sent only to GitHub.
          </p>
          {state?.hasToken && state.tokenPlaintext ? (
            <div className="updates__status updates__status--warn">
              <span className="signal__dot" />
              <span>
                Stored unencrypted — this system has no keychain the app can use. Remove it once the
                repository is public.
              </span>
            </div>
          ) : null}
          {tokenError ? (
            <div className="updates__status updates__status--bad">
              <span className="signal__dot" />
              <span>{tokenError}</span>
            </div>
          ) : null}
        </div>
        {state ? (
          <div className="setting__control">
            {state.hasToken ? (
              <>
                <Chip tone="ok">Saved</Chip>
                <Button variant="ghost" size="md" onClick={() => void setToken(null)} disabled={busy}>
                  Remove
                </Button>
              </>
            ) : (
              <form className="updates__form" onSubmit={(e) => void onSaveToken(e)}>
                <input
                  className="input input--wide"
                  type="password"
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value)
                    if (tokenError) setTokenError(null)
                  }}
                  placeholder="ghp_… or github_pat_…"
                  autoComplete="off"
                  spellCheck={false}
                  aria-label="GitHub access token"
                  disabled={busy}
                />
                <Button type="submit" variant="primary" size="md" disabled={busy || draft.trim() === ''}>
                  Save
                </Button>
              </form>
            )}
          </div>
        ) : null}
      </div>

      {state?.canRollback ? (
        <div className="setting">
          <div className="grow">
            <div className="setting__label">Roll back</div>
            <p className="setting__help">
              Return to the built-in version {state.builtIn}. ORBIT restarts to switch, and the
              downloaded bundle is removed — it can be downloaded again later.
            </p>
          </div>
          <div className="setting__control">
            {confirmRollback ? (
              <>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => void onRollback()}
                  disabled={busy || relaunching !== null}
                >
                  {relaunching === 'rollback' ? 'Restarting…' : 'Yes, roll back'}
                </Button>
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => setConfirmRollback(false)}
                  disabled={relaunching !== null}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button variant="ghost" size="md" onClick={() => setConfirmRollback(true)} disabled={busy}>
                Roll back
              </Button>
            )}
          </div>
        </div>
      ) : null}

      <div className="updates__foot">
        ORBIT {shell} · Electron {versions.electron}
      </div>
    </Card>
  )
}

/* ── Bits ────────────────────────────────────────────────────────────────── */

function chipFor(status: UpdateStatus, current: string): { tone: ChipTone; label: string } {
  switch (status) {
    case 'up-to-date':
      return { tone: 'ok', label: 'Up to date' }
    case 'available':
      return { tone: 'warn', label: 'Update available' }
    case 'ready':
      return { tone: 'warn', label: 'Restart to apply' }
    case 'error':
      return { tone: 'bad', label: 'Error' }
    default:
      return { tone: 'default', label: `Bundle ${current}` }
  }
}

function ReleaseNotes({ notes }: { notes: string }) {
  const text = notes.trim()
  if (!text) {
    return <p className="setting__help">No release notes were published with this version.</p>
  }
  return <Markdown className="updates__notes">{text}</Markdown>
}

/** Re-renders once a minute while there is a "Checked … ago" line to keep honest. */
function useMinuteTick(checkedAt: string | undefined) {
  const [, bump] = useState(0)
  useEffect(() => {
    if (!checkedAt) return
    const id = setInterval(() => bump((n) => n + 1), 60_000)
    return () => clearInterval(id)
  }, [checkedAt])
}

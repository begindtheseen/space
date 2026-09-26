/* ============================================================================
   ORBIT — Settings → Ask AI
   ----------------------------------------------------------------------------
   Where the Anthropic key goes in. It is handed straight to the Mac app, which
   keeps it in the macOS keychain (desktop/config.js) and never gives it back:
   this card only ever learns whether a key is stored. What gets sent when she
   asks is spelled out here too, because "it has AI now" should come with
   exactly what that AI can see.
   ========================================================================== */
import { useEffect, useState } from 'react'
import { IconSpark, IconWarn } from '@/components/icons'
import { Button, Card, CardHead, Chip } from '@/components/ui'
import { AI_KEY_PATTERN, getOrbit, type AiStatus } from '@/lib/desktop'

export function AskAiCard({ index }: { index: number }) {
  const bridge = getOrbit()
  const ai = bridge?.ai
  const [status, setStatus] = useState<AiStatus | null>(null)
  const [draft, setDraft] = useState('')
  const [note, setNote] = useState<{ tone: 'ok' | 'bad'; text: string } | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!ai) return
    let alive = true
    void ai.status().then((s) => alive && setStatus(s))
    return () => {
      alive = false
    }
  }, [ai])

  const save = async (key: string | null) => {
    if (!ai) return
    if (key !== null && !AI_KEY_PATTERN.test(key.trim())) {
      setNote({ tone: 'bad', text: 'That does not look like an Anthropic API key. They start with sk-ant-.' })
      return
    }
    setSaving(true)
    try {
      const next = await ai.setKey(key === null ? null : key.trim())
      setStatus(next)
      if (next.error) setNote({ tone: 'bad', text: next.error })
      else {
        setDraft('')
        setNote({ tone: 'ok', text: key === null ? 'Key removed.' : 'Saved. Highlight anything in a lesson to try it.' })
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card index={index}>
      <CardHead icon={<IconSpark size={15} />} title="Ask AI" divided />
      <div className="sect" style={{ fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.7 }}>
        <p style={{ margin: '0 0 10px' }}>
          Highlight anything in a lesson and press <strong>Explain this</strong>. Claude explains it in plain words, building
          on the lessons you have already read, and links the ones it used.
        </p>
        {!bridge ? (
          <p style={{ margin: 0 }}>Ask AI works in the ORBIT app on the Mac, which keeps the key safe in the keychain.</p>
        ) : !ai || (status && !status.available) ? (
          <p style={{ margin: 0 }}>This copy of the app is too old for Ask AI. Update it from the Updates card and it will appear here.</p>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span>Key:</span>
              {status?.hasKey ? <Chip tone="ok">saved in the keychain</Chip> : <Chip tone="warn">not added yet</Chip>}
            </div>
            {status?.plaintext ? (
              <p style={{ margin: '0 0 10px', color: 'var(--warn)' }}>
                <IconWarn size={13} /> No keychain was available, so the key is stored unencrypted on this Mac.
              </p>
            ) : null}
            <form
              style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}
              onSubmit={(e) => {
                e.preventDefault()
                void save(draft)
              }}
            >
              <input
                type="password"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={status?.hasKey ? 'Paste a new key to replace it' : 'sk-ant-…'}
                autoComplete="off"
                spellCheck={false}
                aria-label="Anthropic API key"
                className="ask__input"
                style={{ flex: '1 1 220px' }}
              />
              <Button variant="primary" size="sm" type="submit" disabled={!draft.trim() || saving}>
                Save key
              </Button>
              {status?.hasKey ? (
                <Button variant="ghost" size="sm" type="button" disabled={saving} onClick={() => void save(null)}>
                  Remove
                </Button>
              ) : null}
            </form>
            {note ? <p style={{ margin: '0 0 10px', color: note.tone === 'ok' ? 'var(--ok)' : 'var(--bad)' }}>{note.text}</p> : null}
            <p style={{ margin: '0 0 8px' }}>
              Get a key at{' '}
              <a href="https://console.anthropic.com/settings/keys" onClick={(e) => { e.preventDefault(); void bridge.openExternal('https://console.anthropic.com/settings/keys') }}>
                console.anthropic.com
              </a>
              . Each answer costs a fraction of a cent to a few cents on that account.
            </p>
          </>
        )}
        <p style={{ margin: 0 }}>
          <strong>What is sent when you ask:</strong> the words you highlighted, the lesson you are reading, and a few
          passages from lessons you have read, to Anthropic. Nothing else: not your progress, scores, code or notes.
        </p>
      </div>
    </Card>
  )
}

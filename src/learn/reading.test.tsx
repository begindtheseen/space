import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Markdown } from '@/lib/markdown'
import { markSolved, whenSolved } from '@/lib/guide'
import { runnableFence } from '@/lib/practice'
import { prepare, toUtterances } from '@/lib/speech'
import { speechUnits } from '@/lib/voice/kokoro'
import { pauseId, pauseIn, readingOf } from './reading'
import { MODULE_TRACKS, TRACKS } from './full'

const runnable = (info: string, code: string) => !!runnableFence(info, code)

describe('a lesson read aloud, with stops at its code windows', () => {
  const teach = [
    'Print says hello.',
    '',
    '```python',
    'print("hello")',
    '```',
    '',
    'A fragment is only shown:',
    '',
    '```python fragment',
    'x = ',
    '```',
    '',
    'And that is all.',
  ].join('\n')

  it('puts a stop where each runnable example is, and keeps the rest as it was', () => {
    const r = readingOf(teach, 'Now print your name.', [], runnable)
    const kinds = Object.values(r.stops).map((s) => s.kind)
    expect(kinds).toEqual(['example', 'task'])
    expect(Object.values(r.stops)[0]).toEqual({ kind: 'example', info: 'python', code: 'print("hello")' })
    expect(r.markdown).toContain('```python fragment\nx = \n```')
    expect(r.markdown).not.toContain('print("hello")')
    expect(r.markdown.indexOf('Your turn.')).toBeLessThan(r.markdown.indexOf('Now print your name.'))
  })

  it('reads each practice item after the task: brought up, read, then waited on', () => {
    const r = readingOf('Text.', 'Task.', [{ id: 'l1.p1', text: 'First problem' }, { id: 'l1.q1', text: 'A question' }], runnable)
    expect(Object.values(r.stops)).toEqual([
      { kind: 'task', id: '' },
      { kind: 'show', id: 'l1.p1' },
      { kind: 'item', id: 'l1.p1' },
      { kind: 'show', id: 'l1.q1' },
      { kind: 'item', id: 'l1.q1' },
    ])
    expect(r.markdown.indexOf('First problem')).toBeLessThan(r.markdown.indexOf('A question'))
  })

  it('every stop survives the text preparation as a sentence of its own, for both voices', () => {
    const r = readingOf(teach, 'Now print your name.', [{ id: 'x.p1', text: 'Problem text.' }], runnable)
    const { text, utterances } = prepare(r.markdown)
    const units = speechUnits(text, (p) => toUtterances(p, 100_000), 200)
    const ids = Object.keys(r.stops)
    expect(utterances.map(pauseIn).filter(Boolean)).toEqual(ids)
    expect(units.map((u) => pauseIn(u.text)).filter(Boolean)).toEqual(ids)
    // Nothing else is taken for a stop.
    expect(utterances.filter((u) => /Orbitpause/.test(u)).length).toBe(ids.length)
  })

  it('does not stop at code inside a context note, which is never read aloud', () => {
    const md = 'Before.\n\n::: context n1 A note\nInside:\n\n```python\nprint(1)\n```\n:::\n\nAfter.'
    const r = readingOf(md, 'Task.', [], runnable)
    expect(Object.values(r.stops).map((s) => s.kind)).toEqual(['task'])
    expect(r.markdown).toContain('```python\nprint(1)\n```')
  })

  it('stop ids are letters only and never repeat', () => {
    const ids = Array.from({ length: 800 }, (_, i) => pauseId(i))
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.every((id) => /^[a-z]+$/.test(id))).toBe(true)
  })

  it('in every course and module, the stops are exactly the code windows the page draws, in order', () => {
    for (const track of [...TRACKS, ...MODULE_TRACKS])
      for (const lesson of track.lessons) {
        if (lesson.gate) continue
        const r = readingOf(lesson.teach, lesson.task, [], runnable)
        const examples = Object.values(r.stops).flatMap((s) => (s.kind === 'example' ? [s.code] : []))
        // What the page's own Markdown hands its code renderer when it draws the lesson.
        const drawn: string[] = []
        renderToStaticMarkup(
          <Markdown notes renderCode={(info, code) => (runnable(info, code) && drawn.push(code), null)}>
            {lesson.teach}
          </Markdown>,
        )
        expect(examples, lesson.id).toEqual(drawn)
        const { utterances } = prepare(r.markdown)
        expect(utterances.map(pauseIn).filter(Boolean), lesson.id).toEqual(Object.keys(r.stops))
      }
  })
})

describe('waiting for a pass', () => {
  it('resolves when that id is passed, not another', async () => {
    let done = false
    const p = whenSolved('a.p1').then(() => (done = true))
    markSolved('a.p2')
    await Promise.resolve()
    expect(done).toBe(false)
    markSolved('a.p1')
    await p
    expect(done).toBe(true)
  })

  it('gives up when the reading stops', async () => {
    const ac = new AbortController()
    const p = whenSolved('b.p1', ac.signal)
    ac.abort()
    await expect(p).rejects.toThrow()
  })
})

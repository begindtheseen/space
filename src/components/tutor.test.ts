import { describe, expect, it } from 'vitest'
import { prepare } from '@/lib/speech'
import { textWords } from '@/lib/voice/kokoro'
import { spokenToUnits } from './Tutor'

const units = (text: string) => {
  const out: { code: boolean; text: string; said: boolean }[] = []
  for (const [i, part] of text.split(/`([^`]+)`/).entries()) {
    if (i % 2) out.push({ code: true, text: part, said: true })
    else for (const w of part.split(/(\s+)/)) if (w) out.push({ code: false, text: w, said: !!w.trim() })
  }
  return out
}
const spoken = (text: string) => {
  const say = prepare(text).utterances.join(' ')
  return textWords(say).map((w) => say.slice(w.start, w.end))
}

describe('the card lights the word being said', () => {
  it('ties the words said for a piece of code to that code on the card', () => {
    const text = 'Rename it: `mv ../feul ../fuel` now.'
    const list = units(text)
    const said = spoken(text)
    const map = spokenToUnits(list, said)
    const code = list.findIndex((u) => u.code)
    // "M V dot dot slash feul dot dot slash fuel" all light the one piece of code.
    said.forEach((w, i) => {
      if (['M', 'V', 'dot', 'slash', 'feul', 'fuel'].includes(w)) expect(map[i]).toBe(code)
    })
    expect(list[map[said.indexOf('now')]!]!.text).toBe('now.')
    expect(list[map[0]!]!.text).toBe('Rename')
  })

  it('never moves backwards', () => {
    const text = 'Close, but `report.txt` says “empty” on line 5, and the task wants 3 lines.'
    const map = spokenToUnits(units(text), spoken(text))
    for (let i = 1; i < map.length; i++) expect(map[i]!).toBeGreaterThanOrEqual(map[i - 1]!)
  })
})

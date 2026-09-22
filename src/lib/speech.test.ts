import { describe, expect, it } from 'vitest'
import {
  mathToWords,
  prepare,
  rankVoices,
  speakableFromMarkdown,
  toUtterances,
  usableVoices,
} from './speech'

describe('maths becomes English', () => {
  it('reads a fraction as "over"', () => {
    expect(mathToWords('\\frac{H^2}{2I_3}')).toBe('H squared over 2 I sub three')
  })

  it('handles a fraction inside a square root', () => {
    expect(mathToWords('\\sqrt{\\frac{a}{b}}')).toBe('the square root of a over b')
  })

  it('names the common powers and reads the rest', () => {
    expect(mathToWords('x^2')).toBe('x squared')
    expect(mathToWords('x^3')).toBe('x cubed')
    expect(mathToWords('x^{n+1}')).toContain('to the power n plus 1')
  })

  it('reads rates and unit vectors the way an engineer says them', () => {
    expect(mathToWords('\\dot{\\omega}')).toBe('omega dot')
    expect(mathToWords('\\ddot{x}')).toBe('x double dot')
    expect(mathToWords('\\hat{n}')).toBe('n hat')
  })

  it('reads a bold symbol as the vector it means', () => {
    expect(mathToWords('\\mathbf{H}')).toBe('H')
    expect(mathToWords('\\vec{v}')).toBe('vector v')
  })

  it('speaks relations rather than spelling them', () => {
    expect(mathToWords('a \\le b')).toBe('a is less than or equal to b')
    expect(mathToWords('T \\approx 2')).toBe('T is approximately 2')
    expect(mathToWords('x \\pm y')).toBe('x plus or minus y')
  })

  it('drops spacing and sizing commands entirely', () => {
    const said = mathToWords('\\left( \\tfrac{1}{2} \\right)\\, I')
    expect(said).not.toMatch(/left|right|tfrac|\\/)
    expect(said).toContain('1 over 2')
  })

  it('never leaves a backslash for the voice to read', () => {
    const samples = [
      '\\frac{H^2}{2I_k}', '\\lVert\\mathbf{H}\\rVert', '\\omega_k^2',
      '2TI_1 \\le H^2 \\le 2TI_3', '\\Delta T = T_0\\left(1 - \\frac{I_1}{I_3}\\right)',
      '\\int_0^t \\mathbf{f}\\,\\mathrm{d}\\tau',
    ]
    for (const s of samples) {
      const said = mathToWords(s)
      expect(said, s).not.toContain('\\')
      expect(said, s).not.toMatch(/[{}]/)
    }
  })

  it('reads a norm as a magnitude', () => {
    expect(mathToWords('\\lVert\\mathbf{H}\\rVert')).toBe('the magnitude of H')
    expect(mathToWords('\\lvert x \\rvert')).toBe('the magnitude of x')
  })

  it('reads a frame bar as the frame it means', () => {
    expect(mathToWords('\\frac{d\\mathbf{H}}{dt}\\right|_N')).toContain('in frame N')
    expect(mathToWords('\\frac{d\\mathbf{H}}{dt}\\right|_N')).not.toContain('sub N')
  })

  it('survives malformed input rather than emitting symbols', () => {
    expect(mathToWords('\\frac{a')).not.toContain('\\')
    expect(mathToWords('')).toBe('')
  })
})

describe('markdown becomes prose', () => {
  it('names a code block instead of reading it', () => {
    const out = speakableFromMarkdown('before\n\n```python\nfor i in range(9):\n    print(i)\n```\n\nafter')
    expect(out).toContain('Code block.')
    expect(out).not.toContain('print')
  })

  it('names a table instead of reading it linearly', () => {
    const out = speakableFromMarkdown('| a | b |\n| --- | --- |\n| 1 | 2 |')
    expect(out).toContain('Table.')
    expect(out).not.toContain('---')
  })

  it('announces a callout before reading it', () => {
    const out = speakableFromMarkdown(':::  key The major-axis rule\nInternal damping drives it.\n:::')
    expect(out).toContain('Key point.')
    expect(out).toContain('The major-axis rule.')
    expect(out).toContain('Internal damping drives it.')
  })

  it('turns a heading into a sentence so the voice drops', () => {
    expect(speakableFromMarkdown('## The energy of a spin')).toBe('The energy of a spin.')
  })

  it('strips emphasis, links and bullets', () => {
    const out = speakableFromMarkdown('- **bold** and *soft* and [a link](http://x.test)')
    expect(out).toBe('bold and soft and a link')
  })

  it('expands units that stand alone', () => {
    expect(speakableFromMarkdown('it flew at 7.7 km/s')).toContain('kilometres per second')
  })
})

describe('splitting for the voice', () => {
  it('splits on sentences, never mid-clause', () => {
    const u = toUtterances('One thing. Two things. Three things.')
    expect(u).toEqual(['One thing.', 'Two things.', 'Three things.'])
  })

  it('does not split after an abbreviation', () => {
    const u = toUtterances('Use a damper, e.g. a fluid ring, to remove nutation. Then spin up.')
    expect(u).toHaveLength(2)
    expect(u[0]).toContain('e.g. a fluid ring')
  })

  it('does not split inside a decimal', () => {
    const u = toUtterances('The ratio is 119.4 for that body. It then flips.')
    expect(u).toHaveLength(2)
    expect(u[0]).toContain('119.4')
  })

  it('breaks a very long sentence at a clause boundary, not a character count', () => {
    const long =
      'The damper removes energy from the spin while the angular momentum stays exactly where it was; ' +
      'the body therefore migrates toward the axis of greatest inertia, and it stays there once it arrives'
    const u = toUtterances(long, 120)
    expect(u.length).toBeGreaterThan(1)
    for (const s of u) expect(s.length).toBeLessThanOrEqual(130)
    expect(u.join(' ')).toContain('angular momentum')
  })

  it('drops fragments with nothing to say', () => {
    expect(toUtterances('...\n\n---\n\n')).toEqual([])
  })
})

describe('a real lesson', () => {
  it('comes out speakable end to end', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('node:fs') as typeof import('node:fs')
    const path = new URL(
      '../curriculum/lessons/t1_m14_rigid_body_dynamics/08-energy-dissipation-and-the-flat-spin-instability.md',
      import.meta.url,
    )
    const md = fs.readFileSync(path, 'utf8')
    const { text, utterances } = prepare(md)

    // Nothing a voice would read as punctuation soup.
    expect(text).not.toContain('\\')
    expect(text).not.toContain('$')
    expect(text).not.toMatch(/```/)
    expect(text).not.toMatch(/^\s*\|/m)

    expect(utterances.length).toBeGreaterThan(20)
    // Every utterance is something a person could say in one breath-group.
    for (const u of utterances) {
      expect(u.length).toBeLessThanOrEqual(340)
      expect(u).not.toContain('\\')
    }
  })
})

describe('choosing a voice', () => {
  const v = (name: string, lang = 'en-US', localService = true) => ({ name, lang, localService })

  it('puts a neural voice above a plain one', () => {
    const best = rankVoices([v('Alex'), v('Ava (Premium)')])[0]
    expect(best!.name).toBe('Ava (Premium)')
  })

  it('buries the novelty voices that sound like a broken robot', () => {
    const order = rankVoices([v('Zarvox'), v('Bubbles'), v('Samantha')])
    expect(order[0]!.name).toBe('Samantha')
    expect(order.map((x) => x.name).slice(-2)).toContain('Zarvox')
  })

  it('never offers a novelty voice at all', () => {
    const names = usableVoices([v('Zarvox'), v('Albert'), v('Samantha')]).map((x) => x.name)
    expect(names).toEqual(['Samantha'])
  })

  it('prefers a local voice, because a remote one pauses before every sentence', () => {
    const order = rankVoices([v('Remote', 'en-US', false), v('Local', 'en-US', true)])
    expect(order[0]!.name).toBe('Local')
  })

  it('drops voices in other languages from the offer', () => {
    const names = usableVoices([v('Amélie', 'fr-FR'), v('Samantha', 'en-US')]).map((x) => x.name)
    expect(names).toEqual(['Samantha'])
  })

  it('returns something even when the system reports nothing useful', () => {
    expect(rankVoices([])).toEqual([])
    expect(usableVoices([])).toEqual([])
  })
})

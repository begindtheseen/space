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
    expect(mathToWords('x^{n+1}')).toBe('x to the power of n plus 1')
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

/* ── Regressions found by listening to a real derivation ─────────────────── */

describe('a rate is never read as the quantity', () => {
  // `\dot R` and `\dot\lambda` are how this curriculum writes range rate and
  // line-of-sight rate. The argument reader required a brace, so both fell
  // through to "drop the command" and the dot vanished: closing speed was
  // read as range, and the rate PN is proportional to as the angle itself.
  it('keeps the dot on an unbraced argument', () => {
    expect(mathToWords('\\dot R')).toBe('R dot')
    expect(mathToWords('\\dot\\lambda')).toBe('lambda dot')
    expect(mathToWords('\\ddot x')).toBe('x double dot')
    expect(mathToWords('\\hat n')).toBe('n hat')
  })

  it('still handles the braced form it always did', () => {
    expect(mathToWords('\\dot{m}')).toBe('m dot')
    expect(mathToWords('\\dot{\\mathbf{r}}_{rel}')).toContain('r dot')
  })

  it('says the sign of a term that opens with a minus', () => {
    expect(mathToWords('V_c \\equiv -\\dot R')).toBe('V sub c is identical to minus R dot')
    expect(mathToWords('-v\\dot{m}')).toBe('minus v m dot')
  })
})

describe('quotients and units', () => {
  it('reads a slash between terms as a division', () => {
    expect(mathToWords('t = R/V_c')).toBe('t equals R divided by V sub c')
    expect(mathToWords('m_0/m_f')).toBe('m sub nought divided by m sub f')
  })

  it('leaves the slash inside a unit alone', () => {
    // "1000 m divided by s" is an algebraic quotient; the text means a speed.
    expect(mathToWords('u = 1000\\ \\text{m/s}')).toBe('u equals 1000 metres per second')
    expect(mathToWords('2750\\ \\text{kg/s}')).toBe('2750 kilograms per second')
    expect(mathToWords('9.81\\ \\text{m/s}^2')).toBe('9.81 metres per second squared')
  })

  it('speaks escaped punctuation instead of its backslash', () => {
    expect(mathToWords('19\\%')).toBe('19 percent')
    expect(mathToWords('(-20,\\ 10,\\ 0)')).not.toContain('\\')
  })
})

describe('sentence closing', () => {
  it('gives every utterance an ending the voice can hear', () => {
    const out = toUtterances('A heading\n\nSome prose that stops\n\nMore here.')
    expect(out.length).toBeGreaterThan(0)
    for (const u of out) expect(u, u).toMatch(/[.!?,;:]$/)
  })

  it('keeps a continuing mark on a piece split for length', () => {
    const long = `${'word '.repeat(70)}, ${'more '.repeat(70)}.`
    const out = toUtterances(long)
    expect(out.length).toBeGreaterThan(1)
    expect(out[0]).toMatch(/,$/)
  })

  it('keeps a displayed equation in the sentence that introduces it', () => {
    // Two paragraphs made two utterances, so the voice stopped dead on "is".
    const out = toUtterances(speakableFromMarkdown('The move is\n\n$$F = ma$$\n\nand that is wrong.'))
    expect(out.some((u) => /The move is F equals ma/.test(u))).toBe(true)
    expect(out.some((u) => u.trim() === 'The move is.')).toBe(false)
  })
})

describe('equations read the way a person says them', () => {
  it('reads a centred dot as times, and keeps "dot" for two vectors', () => {
    expect(mathToWords(String.raw`I \cdot 2^{-n}`)).toBe('I times 2 to the power of minus n')
    expect(mathToWords(String.raw`3 \cdot 4`)).toBe('3 times 4')
    expect(mathToWords('3 · 4')).toBe('3 times 4')
    expect(mathToWords(String.raw`\mathbf{a}\cdot\mathbf{b}`)).toBe('a dot b')
    expect(mathToWords(String.raw`\mathbf a \cdot \mathbf b`)).toBe('a dot b')
    expect(mathToWords(String.raw`\hat{n} \cdot \mathbf{v}`)).toBe('n hat dot v')
    expect(mathToWords(String.raw`\nabla \cdot \mathbf{E}`)).toBe('del dot E')
    // \cdots is not \cdot.
    expect(mathToWords(String.raw`a_1 + \cdots`)).toBe('a sub one plus and so on')
    // Rates keep their dot.
    expect(mathToWords(String.raw`\dot{x} = A x`)).toBe('x dot equals A x')
  })

  it('says "to the power of"', () => {
    expect(mathToWords('e^{-t/\\tau}')).toBe('e to the power of minus t divided by tau')
    expect(mathToWords('10^{-3}')).toBe('10 to the power of minus 3')
    expect(mathToWords('5.783\\times 10^7')).toBe('5.783 times 10 to the power of 7')
    expect(mathToWords('z^{-1}')).toBe('z to the power of minus 1')
    expect(mathToWords('x^n')).toBe('x to the power of n')
    expect(mathToWords('\\omega^\\alpha')).toBe('omega to the power of alpha')
    expect(mathToWords('r^{3/2}')).toBe('r to the power of three halves')
    expect(mathToWords('x^{1/2}')).toBe('x to the power of one half')
  })

  it('names transpose, inverse, star and prime instead of reading them as powers', () => {
    expect(mathToWords('A P + P A^T + B B^T = 0')).toBe('A P plus P A transpose plus B B transpose equals 0')
    expect(mathToWords('\\mathbf{R}^\\top \\mathbf{v}')).toBe('R transpose v')
    expect(mathToWords('C^{\\mathsf{T}}')).toBe('C transpose')
    expect(mathToWords('\\mathbf{P}^{-1}')).toBe('P inverse')
    expect(mathToWords('x^*')).toBe('x star')
    expect(mathToWords("f'(x)")).toBe('f prime (x)')
    expect(mathToWords("\\text{don't}")).toBe("don't")
  })

  it('reads limits on integrals and sums', () => {
    expect(mathToWords('\\int_0^T y(t)\\,dt')).toBe('the integral from 0 to T of y(t) dt')
    expect(mathToWords('\\sum_{k=0}^{N-1} x_k')).toBe('the sum from k equals 0 to N minus 1 of x sub k')
    expect(mathToWords('\\lim_{x \\to 0} f(x)')).toBe('the limit as x goes to 0 of f(x)')
  })

  it('reads degrees, in an equation and in prose', () => {
    expect(mathToWords('65.03^\\circ')).toBe('65.03 degrees')
    expect(mathToWords('90^{\\circ}')).toBe('90 degrees')
    expect(mathToWords('1^\\circ')).toBe('1 degree')
    expect(mathToWords('7.155\\times10^{-3}\\,{}^\\circ/\\mathrm{s}')).toBe('7.155 times 10 to the power of minus 3 degrees per second')
    expect(mathToWords('0.7475\\,{}^\\circ/\\mathrm{s^2}')).toBe('0.7475 degrees per second squared')
    expect(mathToWords('\\tan(10°)')).toContain('tangent')
    expect(mathToWords('\\tan(10°)')).toContain('10 degrees')
    expect(mathToWords('\\cos\\theta')).toBe('cosine theta')
    expect(speakableFromMarkdown('A 53° shell, turning at 12.34°/s.')).toBe('A 53 degrees shell, turning at 12.34 degrees per second.')
    expect(speakableFromMarkdown('Heat it to 20°C.')).toBe('Heat it to 20 degrees Celsius.')
    expect(speakableFromMarkdown('A phase of -8.4 deg.')).toBe('A phase of -8.4 degrees.')
  })

  it('reads the arithmetic symbols prose uses', () => {
    expect(speakableFromMarkdown('About 3 × 10⁸ m/s.')).toBe('About 3 times 10 to the power of 8 metres per second.')
    expect(speakableFromMarkdown('Take 10^6 samples.')).toBe('Take 10 to the power of 6 samples.')
    expect(speakableFromMarkdown('An area in m².')).toBe('An area in m squared.')
    expect(speakableFromMarkdown('It costs 9.81 m/s² of lift.')).toBe('It costs 9.81 metres per second squared of lift.')
    expect(speakableFromMarkdown('first · second')).toBe('first, second')
    expect(speakableFromMarkdown('Done. · Next')).toBe('Done. Next')
  })

  it('reads matrices, cases, aligned working, sets and transforms', () => {
    expect(mathToWords(String.raw`A = \begin{pmatrix} 0 & 1 \\ -2 & -3 \end{pmatrix}`)).toBe(
      'A equals the matrix with row one: 0, 1; row two: minus 2, minus 3,',
    )
    expect(mathToWords(String.raw`\mathbf{x} = \begin{bmatrix} x \\ \dot x \end{bmatrix}`)).toBe('x equals the column vector x, x dot,')
    expect(mathToWords(String.raw`\det\begin{vmatrix} a & b \\ c & d \end{vmatrix} = ad - bc`)).toBe(
      'the determinant of the matrix with row one: a, b; row two: c, d, equals ad minus bc',
    )
    expect(mathToWords(String.raw`f(x) = \begin{cases} x^2 & x \ge 0 \\ 0 & \text{otherwise} \end{cases}`)).toBe(
      'f(x) equals x squared, if x is greater than or equal to 0; 0, otherwise,',
    )
    expect(mathToWords(String.raw`\begin{aligned} a &= b + c \\ &= d \end{aligned}`)).toBe('a equals b plus c. equals d,')
    expect(mathToWords(String.raw`\{ x : a^T x = b \}`)).toBe('the set of x such that a transpose x equals b')
    expect(mathToWords(String.raw`F(s) = \mathcal{L}\{f(t)\}`)).toBe('F(s) equals the Laplace transform of f(t)')
    expect(mathToWords(String.raw`(f \circ g)(x)`)).toBe('(f composed with g)(x)')
    expect(mathToWords(String.raw`\tau^{+1/2}`)).toBe('tau to the power of one half')
  })

  it('reads the cross-product matrix, subscript labels and a dollar sign in prose', () => {
    expect(mathToWords(String.raw`a^\times b`)).toBe('a cross b')
    expect(mathToWords(String.raw`v_{\text{circ}} = \sqrt{\mu/r}`)).toBe('v sub circular equals the square root of mu divided by r')
    expect(speakableFromMarkdown(String.raw`A rate of \$150 per credit, so $60 \times 150 = 9000$ dollars.`)).toBe(
      'A rate of 150 dollars per credit, so 60 times 150 equals 9000 dollars.',
    )
  })
})


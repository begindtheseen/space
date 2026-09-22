import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Markdown } from './markdown'

const render = (src: string) => renderToStaticMarkup(<Markdown>{src}</Markdown>)

describe('markdown renderer', () => {
  it('renders inline and display math as KaTeX mounts with the source as label', () => {
    const html = render('Newton: $F = ma$ and\n\n$$\n\\Delta v = v_e \\ln \\frac{m_0}{m_f}\n$$\n')
    expect(html).toContain('aria-label="F = ma"')
    expect(html).toContain('md__math--display')
    expect(html).toContain('md__mathblock')
    expect(html).not.toContain('$F')
  })

  it('renders escaped dollars literally', () => {
    expect(render('Costs \\$5, then \\$6 later.')).toContain('Costs $5, then $6 later.')
  })

  it('renders tables with alignment', () => {
    const html = render('| Symbol | Meaning |\n| :-- | --: |\n| $v_e$ | exhaust velocity |\n')
    expect(html).toContain('<table class="md__table">')
    expect(html).toContain('text-align:right')
    expect(html).toContain('exhaust velocity')
  })

  it('renders callout blocks, with answers folded', () => {
    const html = render('::: example Falcon 9\nBody text.\n:::\n\n::: answer\nHidden.\n:::\n')
    expect(html).toContain('md__box--example')
    expect(html).toContain('Falcon 9')
    expect(html).toContain('<details class="md__box md__box--answer">')
    expect(html).toContain('<summary class="md__box__label">Answer</summary>')
  })

  it('keeps continuation lines and nested bullets inside list items', () => {
    const html = render('- First item\n  continues here\n  - nested\n- Second\n')
    expect(html).toContain('First item continues here')
    expect(html).toContain('<ul class="md__ul"><li>nested</li></ul>')
    expect((html.match(/<li>/g) ?? []).length).toBe(3)
  })

  it('never emits raw HTML from the source', () => {
    expect(render('<script>alert(1)</script> and <b>bold</b>')).not.toContain('<script>')
  })
})

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LearnerProvider } from '@/hooks/useLearner'
import { Markdown } from './markdown'

// The provider is needed because a `::: video` block reads the saved playback
// position. Effects do not run under renderToStaticMarkup, so it renders
// against a fresh learner state rather than touching storage.
const render = (src: string) =>
  renderToStaticMarkup(
    <LearnerProvider>
      <Markdown>{src}</Markdown>
    </LearnerProvider>,
  )

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

describe('lesson video', () => {
  it('renders a click-to-load facade rather than an iframe', () => {
    const html = render('::: video dQw4w9WgXcQ\nOrbital mechanics explained · Some Channel · 12 min\n:::\n')
    // No frame and no player until she presses play: a lesson with six videos
    // costs six thumbnails, not six embedded players.
    expect(html).not.toContain('<iframe')
    expect(html).not.toContain('youtube-nocookie.com')
    expect(html).toContain('i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg')
    expect(html).toContain('Orbital mechanics explained')
    expect(html).toContain('Play')
  })

  it('refuses a malformed id instead of embedding it', () => {
    const html = render('::: video not-a-real-id-at-all\nBroken\n:::\n')
    expect(html).toContain('video--broken')
    expect(html).not.toContain('ytimg.com')
  })

  it('keeps the rest of the lesson around the video', () => {
    const html = render('Before.\n\n::: video dQw4w9WgXcQ\nA video\n:::\n\nAfter.\n')
    expect(html).toContain('Before.')
    expect(html).toContain('After.')
  })
})

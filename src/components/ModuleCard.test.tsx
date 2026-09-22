/* ============================================================================
   ORBIT — the module card tells the truth about what is written
   ----------------------------------------------------------------------------
   The browse pages show every module in the curriculum, and most of a hundred
   cards look identical at a glance. What she cannot see from the outside is
   which of them she can actually sit down and study, so the card carries it.
   These tests pin that, because it is the kind of signal that quietly stops
   rendering and nobody notices until someone opens an empty module.

   The modules are chosen from the coverage record at run time rather than
   named here: the corpus is still being written, so any module named today as
   "partly written" is a test that fails the week it is finished.
   ========================================================================== */
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LESSON_COVERAGE } from '@/curriculum/lessons/manifest'
import { moduleById } from '@/curriculum'
import { ModuleCard } from './ModuleCard'

const render = (id: string) => {
  const module = moduleById(id)
  if (!module) throw new Error(`no such module: ${id}`)
  return renderToStaticMarkup(
    <ModuleCard module={module} mastery={0} blockers={[]} unlocks={0} accent="#7aa2ff" />,
  )
}

const pick = (match: (c: { covered: number; complete: boolean }) => boolean) =>
  Object.keys(LESSON_COVERAGE).find((id) => moduleById(id) && match(LESSON_COVERAGE[id]!))

describe('module card coverage signal', () => {
  const taught = pick((c) => c.complete)
  const partial = pick((c) => !c.complete && c.covered > 0)
  const empty = pick((c) => c.covered === 0)

  it('marks a fully taught module as taught', () => {
    expect(taught, 'no fully taught module to test against').toBeTruthy()
    const html = render(taught!)
    expect(html).toContain('chip--ok')
    expect(html).toContain('taught')
    // Not the partial form: a finished module must not read "12/12 taught".
    expect(html).not.toMatch(/\d+\/\d+ taught/)
    expect(html).not.toContain('lessons coming')
  })

  it('says how far a partly written module gets', () => {
    if (!partial) return // every module is finished; nothing to assert
    const c = LESSON_COVERAGE[partial]!
    const html = render(partial)
    expect(html).toContain(`${c.covered}/${c.total} taught`)
  })

  it('does not present an unwritten module as ready to study', () => {
    if (!empty) return // the whole corpus is written
    const html = render(empty)
    expect(html).toContain('lessons coming')
    // The lesson count belongs to the stats row and must not appear at zero.
    expect(html).not.toContain('0 lessons')
  })

  it('counts the lessons a written module actually has', () => {
    expect(taught).toBeTruthy()
    const html = render(taught!)
    expect(html).toMatch(/\d+ lessons/)
  })
})

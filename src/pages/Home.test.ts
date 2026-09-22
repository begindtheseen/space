/* ============================================================================
   ORBIT — the first-run card points somewhere real
   ----------------------------------------------------------------------------
   The welcome card sends a new reader to the eligibility module before
   anything else, because that is the one answer worth having before two
   thousand hours of study. A link that rots into a dead route would fail
   silently and would fail on exactly the step that matters most, so the
   destinations are checked against the curriculum rather than trusted.
   ========================================================================== */
import { describe, expect, it } from 'vitest'
import { moduleById } from '@/curriculum'
import { WELCOME_STEPS } from './Home'

describe('first-run welcome', () => {
  it('links only to modules that exist', () => {
    const linked = WELCOME_STEPS.filter((s) => s.to)
    expect(linked.length, 'the eligibility step should carry a link').toBeGreaterThan(0)
    for (const step of linked) {
      const id = step.to!.replace(/^\/module\//, '')
      expect(moduleById(id), `welcome step links to a missing module: ${step.to}`).toBeTruthy()
    }
  })

  it('can actually render the linked phrase, which must occur in the step text', () => {
    for (const step of WELCOME_STEPS) {
      if (!step.to) continue
      expect(step.linkText, 'a linked step needs the phrase to link').toBeTruthy()
      expect(step.text).toContain(step.linkText!)
    }
  })

  it('puts eligibility first', () => {
    expect(WELCOME_STEPS[0]!.to).toBe('/module/car_01_itar_gate')
  })
})

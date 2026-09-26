import { describe, expect, it } from 'vitest'
import { coerceRun, lockAllows, startRun, type FocusPick } from './focus'

const code: FocusPick = {
  kind: 'learn-code',
  title: 'Code: Variables',
  why: '',
  href: '/learn/py-03',
  also: ['/learn/python', '/learn/py-01', '/learn/py-03', '/learn/py-04', '/learn/python-intermediate', '/learn/py-i-01'],
}

describe('a focus block on Learn to code', () => {
  it('lets her move between the lessons and courses of that language, and nowhere else', () => {
    const run = startRun(code, 25)
    expect(lockAllows(run, '/learn/py-03')).toBe(true)
    expect(lockAllows(run, '/learn/py-04')).toBe(true)
    expect(lockAllows(run, '/learn/python')).toBe(true)
    expect(lockAllows(run, '/learn/py-i-01')).toBe(true)
    expect(lockAllows(run, '/learn/js-01')).toBe(false)
    expect(lockAllows(run, '/learn')).toBe(false)
    expect(lockAllows(run, '/module/t0_m01_algebra_precalc')).toBe(false)
    expect(lockAllows(run, '/settings')).toBe(false)
  })

  it('survives being saved and restored, and drops anything that is not an in-app path', () => {
    const raw = JSON.parse(JSON.stringify(startRun({ ...code, also: [...code.also!, '//evil.example', 'https://x', 42 as never] }, 25)))
    const back = coerceRun(raw)!
    expect(back.pick.kind).toBe('learn-code')
    expect(back.pick.also).toEqual(code.also)
    expect(lockAllows(back, '/learn/py-04')).toBe(true)
  })

  it('leaves blocks without extra paths exactly as they were', () => {
    const back = coerceRun(JSON.parse(JSON.stringify(startRun({ kind: 'review', title: 'x', why: '', href: '/review' }, 15))))!
    expect(back.pick.also).toBeUndefined()
    expect(lockAllows(back, '/review')).toBe(true)
    expect(lockAllows(back, '/learn/py-01')).toBe(false)
  })
})

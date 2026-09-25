import { describe, expect, it } from 'vitest'
import { echoExpressions, fromTranscript } from './echo'

describe('console-style examples', () => {
  it('shows each JavaScript expression line, keeping the lines and the comments', () => {
    const src = 'Math.round(2.6)      // 3\n(0.1 + 0.2)          // 0.3…'
    const out = echoExpressions('javascript', src)
    expect(out.split('\n').slice(0, 2)).toEqual([';__echo(Math.round(2.6))  // 3', ';__echo((0.1 + 0.2))  // 0.3…'])
    expect(out).toContain('function __echo(v)')
  })

  it('leaves declarations, assignments, blocks and multi-line code alone', () => {
    const src = 'const a = 1\nlet b = [\n  1,\n  2,\n]\nif (a) {\n  a + 1\n}\nb = 3\na === 1'
    const lines = echoExpressions('javascript', src).split('\n')
    expect(lines.slice(0, 9)).toEqual(src.split('\n').slice(0, 9))
    expect(lines[9]).toBe(';__echo(a === 1)')
  })

  it('leaves an example that prints on its own untouched', () => {
    const src = 'console.log(1)\n2 + 2'
    expect(echoExpressions('javascript', src)).toBe(src)
    expect(echoExpressions('python', 'print(1)\n2 + 2')).toBe('print(1)\n2 + 2')
  })

  it('echoes Python expressions the way the REPL does, None hidden', () => {
    const out = echoExpressions('python', 'nums = [3, 1, 2]\nsorted(nums)   # [1, 2, 3]\nnums.append(4)\nlen("hi") == 2')
    expect(out.split('\n')).toEqual([
      'nums = [3, 1, 2]',
      'if (__v := (sorted(nums))) is not None: print(repr(__v))  # [1, 2, 3]',
      'if (__v := (nums.append(4))) is not None: print(repr(__v))',
      'if (__v := (len("hi") == 2)) is not None: print(repr(__v))',
    ])
  })

  it('does nothing to languages without a console here', () => {
    expect(echoExpressions('cpp', '1 + 1')).toBe('1 + 1')
  })

  it('turns a Python REPL transcript into the code she would type', () => {
    const t = '>>> def q(rho, v):\n...     return 0.5 * rho * v * v\n...\n>>> q(1.225, 250.0)\n38281.25\n>>> print(q(1, 2))\n2.0'
    expect(fromTranscript(t)).toBe('def q(rho, v):\n    return 0.5 * rho * v * v\n\nq(1.225, 250.0)\nprint(q(1, 2))\n')
    expect(fromTranscript('x = 1\nprint(x)')).toBe('x = 1\nprint(x)')
    // Run as the REPL ran it: expressions echo even though the block also prints.
    expect(echoExpressions('python', fromTranscript(t), true).split('\n')[3]).toBe('if (__v := (q(1.225, 250.0))) is not None: print(repr(__v))')
  })
})

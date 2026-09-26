import { describe, expect, it } from 'vitest'
import { runnableFence } from '@/lib/practice'
import { importsBefore } from './lessonCode'

describe('runnable code in lessons', () => {
  it('carries earlier imports to a later Python snippet that lacks them, on one line', () => {
    const body = 'Intro\n```python\nimport numpy as np\nfrom math import pi\nx = np.zeros(3)\n```\nMore\n```python\nprint(np.ones(2) * pi)\n```\n'
    expect(importsBefore(body, 'print(np.ones(2) * pi)\n')).toBe('import numpy as np; from math import pi')
    expect(importsBefore(body, 'import numpy as np\nfrom math import pi\nx = np.zeros(3)\n')).toBe('')
  })

  it('offers to run only what can run here as written', () => {
    expect(runnableFence('python', 'print(1)')).toBe('python')
    expect(runnableFence('cpp', 'int add(int a, int b) { return a + b; }')).toBeNull()
    expect(runnableFence('cpp', '#include <cstdio>\nint main() { return 0; }')).toBe('cpp')
    expect(runnableFence('bash', 'mkdir notes && cd notes\ngit init')).toBe('bash')
    expect(runnableFence('bash', 'cmake -B build && cmake --build build')).toBeNull()
    expect(runnableFence('text', 'output')).toBeNull()
  })
})

import { describe, expect, it } from 'vitest'
import { isWhole, runnableFence } from './practice'

describe('runnable lesson code', () => {
  it('does not offer Run on a piece of a C++ program', () => {
    expect(runnableFence('cpp', 'int main() {\n')).toBeNull()
    expect(runnableFence('cpp', '#include <iostream>\nint main() {\n    std::cout << "}";\n    return 0;\n}\n')).toBe('cpp')
  })
  it('does not offer Run on a Python block left open', () => {
    expect(runnableFence('python', 'def area(r):\n')).toBeNull()
    expect(runnableFence('python', 'for x in [1, 2,\n')).toBeNull()
    expect(runnableFence('python', 'def area(r):\n    return 3.14 * r * r  # {\nprint(area(2))\n')).toBe('python')
  })
  it('ignores brackets inside strings and comments', () => {
    expect(isWhole('cpp', 'int main() { /* { */ return 0; } // }')).toBe(true)
    expect(isWhole('python', 'print("(")')).toBe(true)
  })
})

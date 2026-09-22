import { describe, expect, it } from 'vitest'
import { compare, gt, gte, parse, valid } from '../semver.js'

describe('semver.parse', () => {
  it('parses release and prerelease versions', () => {
    expect(parse('1.2.3')).toEqual({ major: 1, minor: 2, patch: 3, prerelease: [] })
    expect(parse('0.0.0')).toEqual({ major: 0, minor: 0, patch: 0, prerelease: [] })
    expect(parse('1.0.0-beta.2')).toEqual({ major: 1, minor: 0, patch: 0, prerelease: ['beta', '2'] })
    expect(parse('10.20.30-rc-1.x.7')).toEqual({ major: 10, minor: 20, patch: 30, prerelease: ['rc-1', 'x', '7'] })
  })

  it('rejects everything else', () => {
    for (const bad of ['', '1', '1.2', 'v1.2.3', '1.2.3+build', '01.2.3', '1.2.3-', '1.2.3-a..b', '1.2.3-01', ' 1.2.3', '1.2.3 ', '1.2.3.4', 'latest']) {
      expect(() => parse(bad), bad).toThrow(TypeError)
      expect(valid(bad), bad).toBe(false)
    }
    expect(() => parse(undefined)).toThrow(TypeError)
    expect(() => parse(123)).toThrow(TypeError)
    expect(valid(null)).toBe(false)
  })
})

describe('semver.compare', () => {
  it('orders numerically, not lexically', () => {
    expect(compare('1.0.0', '1.0.0')).toBe(0)
    expect(compare('1.0.1', '1.0.0')).toBe(1)
    expect(compare('1.0.0', '1.0.10')).toBe(-1)
    expect(compare('1.10.0', '1.9.0')).toBe(1)
    expect(compare('2.0.0', '10.0.0')).toBe(-1)
  })

  it('ranks prerelease below release and follows the spec example chain', () => {
    expect(compare('1.0.0-alpha', '1.0.0')).toBe(-1)
    expect(compare('1.0.0', '1.0.0-rc.1')).toBe(1)
    const chain = ['1.0.0-alpha', '1.0.0-alpha.1', '1.0.0-alpha.beta', '1.0.0-beta', '1.0.0-beta.2', '1.0.0-beta.11', '1.0.0-rc.1', '1.0.0']
    for (let i = 1; i < chain.length; i++) {
      expect(compare(chain[i - 1], chain[i]), `${chain[i - 1]} < ${chain[i]}`).toBe(-1)
      expect(compare(chain[i], chain[i - 1]), `${chain[i]} > ${chain[i - 1]}`).toBe(1)
    }
    expect(compare('1.0.0-beta.2', '1.0.0-beta.2')).toBe(0)
  })

  it('gt / gte are consistent with compare', () => {
    expect(gt('1.0.1', '1.0.0')).toBe(true)
    expect(gt('1.0.0', '1.0.0')).toBe(false)
    expect(gt('1.0.0-pre.1', '1.0.0')).toBe(false)
    expect(gte('1.0.0', '1.0.0')).toBe(true)
    expect(gte('0.9.9', '1.0.0')).toBe(false)
    expect(() => gt('1.0.0', 'nope')).toThrow(TypeError)
  })
})

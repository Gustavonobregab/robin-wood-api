import { describe, it, expect } from 'vitest'
import { maskKey, formatBytes } from '../utils'

describe('maskKey', () => {
  it('returns short keys unchanged', () => {
    expect(maskKey('short')).toBe('short')
  })

  it('returns 12-char key unchanged', () => {
    expect(maskKey('sk_live_a1b2')).toBe('sk_live_a1b2')
  })

  it('truncates key longer than 12 chars with ellipsis', () => {
    expect(maskKey('sk_live_a1b2c3d4e5f6g7h8')).toBe('sk_live_a1b2…')
  })
})

describe('formatBytes', () => {
  it('returns 0 B for 0', () => {
    expect(formatBytes(0)).toBe('0 B')
  })

  it('returns 0 B for negative input', () => {
    expect(formatBytes(-100)).toBe('0 B')
  })

  it('formats bytes', () => {
    expect(formatBytes(512)).toBe('512 B')
  })

  it('formats kilobytes', () => {
    expect(formatBytes(1024)).toBe('1 KB')
  })

  it('formats megabytes', () => {
    expect(formatBytes(1048576)).toBe('1 MB')
  })

  it('clamps to GB for very large values', () => {
    const result = formatBytes(1024 * 1024 * 1024 * 1024) // 1 TB
    expect(result).toMatch(/GB$/)
  })
})

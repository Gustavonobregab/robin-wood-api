import { describe, it, expect, vi, beforeEach } from 'vitest'

// We test that each function calls the right endpoint with the right method.
// We mock the http/api module's clientApi directly.

const mockJson = vi.fn()
const mockGet = vi.fn(() => ({ json: mockJson }))
const mockPost = vi.fn(() => ({ json: mockJson }))
const mockDelete = vi.fn(() => ({ json: mockJson }))

vi.mock('@/app/http/api', () => ({
  clientApi: {
    get: mockGet,
    post: mockPost,
    delete: mockDelete,
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockJson.mockResolvedValue({ data: {} })
})

describe('getApiKeys', () => {
  it('calls GET keys', async () => {
    const { getApiKeys } = await import('../keys')
    await getApiKeys()
    expect(mockGet).toHaveBeenCalledWith('keys')
  })
})

describe('createApiKey', () => {
  it('calls POST keys with name', async () => {
    const { createApiKey } = await import('../keys')
    await createApiKey('production')
    expect(mockPost).toHaveBeenCalledWith('keys', { json: { name: 'production' } })
  })
})

describe('revokeApiKey', () => {
  it('calls DELETE keys/:id', async () => {
    const { revokeApiKey } = await import('../keys')
    await revokeApiKey('abc123')
    expect(mockDelete).toHaveBeenCalledWith('keys/abc123')
  })
})

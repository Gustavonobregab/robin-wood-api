// dashboard/app/http/api.ts
import ky from 'ky'

export const api = ky.create({
  prefixUrl: process.env.NEXT_PUBLIC_API_URL,
})

export const clientApi = ky.create({
  prefixUrl: process.env.NEXT_PUBLIC_API_URL,
  credentials: 'include',
  hooks: {
    beforeRequest: [
      (request) => {
        if (typeof window === 'undefined') return
        const apiKey = localStorage.getItem('robin_api_key')
        if (apiKey) request.headers.set('X-API-Key', apiKey)
      },
    ],
  },
})

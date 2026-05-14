'use client'
import { ApiClient } from './client'

// Browser-side API client. Use from client components, event handlers, and
// hooks. Reads the Clerk JWT from `window.Clerk.session.getToken()` which
// is populated by `<ClerkProvider>` once a session is active.

declare global {
  interface Window {
    Clerk?: {
      session?: {
        getToken: () => Promise<string | null>
      }
    }
  }
}

function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL
  if (!url) {
    throw new Error(
      'NEXT_PUBLIC_API_URL is not configured. Set it to the backend origin (e.g. https://api.cityofkaris.com).',
    )
  }
  return url
}

let _browser: ApiClient | undefined

export function getBrowserApi(): ApiClient {
  if (!_browser) {
    _browser = new ApiClient({
      baseUrl: getBaseUrl(),
      getToken: async () => {
        const session = typeof window !== 'undefined' ? window.Clerk?.session : undefined
        if (!session) return null
        return session.getToken()
      },
    })
  }
  return _browser
}

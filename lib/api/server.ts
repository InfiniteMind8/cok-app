import 'server-only'
import { auth } from '@clerk/nextjs/server'
import { ApiClient } from './client'

// Server-side API client. Use from server components, route handlers, and
// server actions. Pulls the Clerk JWT via the `auth()` helper which reads
// it from the request cookies.

function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL
  if (!url) {
    throw new Error(
      'NEXT_PUBLIC_API_URL is not configured. Set it to the backend origin (e.g. https://api.cityofkaris.com).',
    )
  }
  return url
}

let _server: ApiClient | undefined

/**
 * Returns a singleton ApiClient configured for server-side use. Each call
 * to `request()` re-fetches the token, so it works correctly across
 * concurrent requests in Next.js's per-request server context.
 */
export function getServerApi(): ApiClient {
  if (!_server) {
    _server = new ApiClient({
      baseUrl: getBaseUrl(),
      getToken: async () => {
        const { getToken } = await auth()
        return getToken()
      },
    })
  }
  return _server
}

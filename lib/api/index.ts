// Public API surface for the website→backend client.
//
// IMPORTANT: this barrel intentionally does NOT re-export `getServerApi`.
// `./server.ts` has `import 'server-only'` at top, and Next.js will reject
// any client component whose import graph reaches it — even transitively
// through a barrel. Server callers MUST import server.ts directly:
//
//   // Server component / route handler:
//   import { getServerApi } from '@/lib/api/server'
//   import { meApi } from '@/lib/api'
//   const me = await meApi.get(getServerApi())
//
//   // Client component / event handler / hook:
//   import { getBrowserApi } from '@/lib/api/browser'   // or from this barrel
//   import { residentWalletApi } from '@/lib/api'
//   await residentWalletApi.requestSettlement(getBrowserApi(), '100', '...')
//
// `getBrowserApi` is browser-safe so it stays on the barrel for convenience.

export { ApiClient, ApiClientError } from './client'
export type { ApiClientConfig, ApiErrorCode, GetToken, RequestOptions } from './client'

export { getBrowserApi } from './browser'

export * from './types'

export { meApi } from './me'
export * from './system'
export * from './resident'
export * from './admin'

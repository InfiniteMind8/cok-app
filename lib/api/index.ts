// Public API surface for the website→backend client.
//
// Usage:
//   // Server component / route handler / server action:
//   import { getServerApi, meApi } from '@/lib/api'
//   const me = await meApi.get(getServerApi())
//
//   // Client component / event handler / hook:
//   import { getBrowserApi, residentWalletApi } from '@/lib/api'
//   const api = getBrowserApi()
//   await residentWalletApi.requestSettlement(api, '100', 'Monthly settlement')

export { ApiClient, ApiClientError } from './client'
export type { ApiClientConfig, ApiErrorCode, GetToken, RequestOptions } from './client'

export { getServerApi } from './server'
export { getBrowserApi } from './browser'

export * from './types'

export { meApi } from './me'
export * from './system'
export * from './resident'
export * from './admin'

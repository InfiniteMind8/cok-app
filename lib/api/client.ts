// Core API client — typed wrapper around `fetch` that injects a Clerk JWT
// and unwraps the backend's `{ ok, data | error }` envelope.
//
// Don't import this directly in components. Use the convenience helpers in
// `./server` (server components / route handlers / server actions) or
// `./browser` (client components / event handlers).

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'

export class ApiClientError extends Error {
  readonly code: ApiErrorCode
  readonly status: number
  readonly details?: unknown

  constructor(code: ApiErrorCode, message: string, status: number, details?: unknown) {
    super(message)
    this.name = 'ApiClientError'
    this.code = code
    this.status = status
    this.details = details
  }
}

type Envelope<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: ApiErrorCode; message: string; details?: unknown } }

export type GetToken = () => Promise<string | null | undefined>

export interface ApiClientConfig {
  /** Base URL of the backend, e.g. https://api.cityofkaris.com */
  baseUrl: string
  /** Returns the current Clerk JWT, or null if the caller is anonymous. */
  getToken: GetToken
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT'
  /** JSON body. Mutually exclusive with `formData`. */
  body?: unknown
  /** multipart/form-data body. Mutually exclusive with `body`. */
  formData?: FormData
  /** Query params. Values are URL-encoded; `undefined` keys are omitted. */
  query?: Record<string, string | number | undefined>
  /** Pass false on truly public endpoints (e.g. /v1/attachments/serve). */
  authenticated?: boolean
  /** Override the default cache behaviour. */
  cache?: RequestCache
  /** Pass-through headers (rare — usually unnecessary). */
  headers?: Record<string, string>
  /** Raw response handlers — bypasses envelope unwrap. Use for binary downloads. */
  raw?: boolean
}

export class ApiClient {
  constructor(private readonly config: ApiClientConfig) {}

  /**
   * Send a request, validate the envelope, and return the unwrapped data.
   * Throws `ApiClientError` on non-2xx or `{ ok: false }` responses.
   */
  async request<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
    const url = this.buildUrl(path, opts.query)

    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(opts.headers ?? {}),
    }

    if (opts.authenticated !== false) {
      const token = await this.config.getToken()
      if (!token) {
        throw new ApiClientError(
          'UNAUTHORIZED',
          'No Clerk session — sign in before calling this endpoint.',
          401,
        )
      }
      headers.Authorization = `Bearer ${token}`
    }

    let body: BodyInit | undefined
    if (opts.formData) {
      body = opts.formData
      // Don't set Content-Type — fetch sets the multipart boundary itself.
    } else if (opts.body !== undefined) {
      body = JSON.stringify(opts.body)
      headers['Content-Type'] = 'application/json'
    }

    const res = await fetch(url, {
      method: opts.method ?? (body ? 'POST' : 'GET'),
      headers,
      body,
      cache: opts.cache,
    })

    if (opts.raw) {
      if (!res.ok) {
        throw new ApiClientError(
          'INTERNAL_ERROR',
          `Request failed: ${res.status} ${res.statusText}`,
          res.status,
        )
      }
      return res as unknown as T
    }

    const json = (await res.json().catch(() => null)) as Envelope<T> | null

    if (!json) {
      throw new ApiClientError(
        'INTERNAL_ERROR',
        `Non-JSON response from backend (status ${res.status})`,
        res.status,
      )
    }

    if (!json.ok) {
      throw new ApiClientError(json.error.code, json.error.message, res.status, json.error.details)
    }

    return json.data
  }

  /** Convenience helpers. Mirror the verbs of REST handlers. */
  get<T>(path: string, opts?: Omit<RequestOptions, 'method' | 'body' | 'formData'>) {
    return this.request<T>(path, { ...opts, method: 'GET' })
  }
  post<T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'method' | 'body'>) {
    return this.request<T>(path, { ...opts, method: 'POST', body })
  }
  patch<T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'method' | 'body'>) {
    return this.request<T>(path, { ...opts, method: 'PATCH', body })
  }
  delete<T>(path: string, opts?: Omit<RequestOptions, 'method'>) {
    return this.request<T>(path, { ...opts, method: 'DELETE' })
  }
  upload<T>(path: string, formData: FormData, opts?: Omit<RequestOptions, 'method' | 'body' | 'formData'>) {
    return this.request<T>(path, { ...opts, method: 'POST', formData })
  }

  private buildUrl(path: string, query?: RequestOptions['query']): string {
    const base = this.config.baseUrl.replace(/\/+$/, '')
    const cleanPath = path.startsWith('/') ? path : `/${path}`
    let url = `${base}${cleanPath}`
    if (query) {
      const params = new URLSearchParams()
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== null) params.set(k, String(v))
      }
      const qs = params.toString()
      if (qs) url += `?${qs}`
    }
    return url
  }
}

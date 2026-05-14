import type { ApiClient } from './client'

// System routes — attachments (mixed auth), demo auth/token, sentry-test.

export const attachmentsApi = {
  // GET /v1/attachments/serve?token=... — public; HMAC token in URL.
  // Returns the raw response (use `raw: true` to bypass envelope unwrap).
  serve: (api: ApiClient, token: string) =>
    api.request<Response>('/v1/attachments/serve', {
      method: 'GET',
      query: { token },
      authenticated: false,
      raw: true,
    }),

  // POST /v1/attachments/upload — multipart form upload. `entityId` is optional;
  // omit for new-entity forms where the parent record does not exist yet (the
  // backend stores the file under an `unknown` placeholder until the record is
  // created and stitched up via the AttachmentInput list on submit).
  upload: (
    api: ApiClient,
    file: File,
    fields: { entityType: string; entityId?: string; fieldName: string; category?: string },
  ) => {
    const fd = new FormData()
    fd.set('file', file)
    fd.set('entityType', fields.entityType)
    if (fields.entityId) fd.set('entityId', fields.entityId)
    fd.set('fieldName', fields.fieldName)
    if (fields.category) fd.set('category', fields.category)
    return api.upload<{
      storageKey: string
      sha256: string
      encrypted: boolean
      name: string
      size: number
      type: string
      category: string
    }>('/v1/attachments/upload', fd)
  },

  // GET /v1/attachments/:id/url — uploader OR admin
  getUrl: (api: ApiClient, attachmentId: string) =>
    api.get<{ url: string }>(`/v1/attachments/${attachmentId}/url`),
}

export const authApi = {
  // POST /v1/auth/token — demo only (404 in production)
  mintDemoToken: (api: ApiClient, userId: string) =>
    api.post<{ token: string }>('/v1/auth/token', { userId }),
}

export const sentryTestApi = {
  // GET /v1/system/sentry-test — MASTER_ADMIN only
  trigger: (api: ApiClient) => api.get<never>('/v1/system/sentry-test'),
}

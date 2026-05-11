import type { ApiClient } from './client'
import type { DisplayCurrency, MeResponse } from './types'

// `/v1/me/*` endpoints — caller-scoped, role-agnostic where possible.

export const meApi = {
  // GET /v1/me — current user profile
  get: (api: ApiClient) => api.get<MeResponse>('/v1/me'),

  // GET /v1/me/tour-status — should the onboarding tour show?
  tourStatus: (api: ApiClient) =>
    api.get<{ shouldShow: boolean }>('/v1/me/tour-status'),

  // GET /v1/me/broadcasts/active — emergency broadcasts the caller hasn't ack'd
  getActiveBroadcasts: (api: ApiClient) =>
    api.get<
      Array<{
        id: string
        headline: string
        message: string
        severity: 'INFO' | 'URGENT' | 'CRITICAL'
        publishedAt: string
      }>
    >('/v1/me/broadcasts/active'),

  // GET /v1/me/visitor-groups — caller's active visitor-group memberships
  // (already filtered to non-archived). Used by the resident community page
  // when the caller is a VISITOR.
  getVisitorGroups: (api: ApiClient) =>
    api.get<
      Array<{
        id: string
        name: string
        theme: string | null
        description: string
        archived: boolean
      }>
    >('/v1/me/visitor-groups'),

  // POST /v1/me/tour/complete | /tour/dismiss
  completeTour: (api: ApiClient) =>
    api.post<{ completed: true }>('/v1/me/tour/complete'),
  dismissTour: (api: ApiClient) =>
    api.post<{ dismissed: true }>('/v1/me/tour/dismiss'),

  // POST /v1/me/notifications/mark-all-read
  markAllNotificationsRead: (api: ApiClient) =>
    api.post<{ markedRead: true }>('/v1/me/notifications/mark-all-read'),

  // POST /v1/me/profile/display-currency
  updateDisplayCurrency: (api: ApiClient, currency: DisplayCurrency) =>
    api.post<{ currency: DisplayCurrency }>('/v1/me/profile/display-currency', { currency }),

  // POST /v1/me/profile/introduction
  updateIntroduction: (api: ApiClient, introduction: string) =>
    api.post<{ introduction: string }>('/v1/me/profile/introduction', { introduction }),

  // POST /v1/me/profile/photo
  setProfilePhoto: (api: ApiClient, url: string) =>
    api.post<{ profilePhotoUrl: string }>('/v1/me/profile/photo', { url }),

  // POST /v1/me/profile/photo-upload
  uploadProfilePhoto: (api: ApiClient, storageKey: string) =>
    api.post<{ signedUrl: string }>('/v1/me/profile/photo-upload', { storageKey }),
}

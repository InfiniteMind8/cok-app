// D.4: pure-type module. The runtime audit-log readers live on the backend
// (lib/queries/audit-log.ts in cok_backend_app). The website consumes the
// rows via `adminAuditLogApi.list` and the data-directory entity-detail
// shape below.

export interface AuditEntry {
  id: string
  action: string
  entity: string
  entityId: string | null
  actorId: string
  before: unknown
  after: unknown
  createdAt: string
}

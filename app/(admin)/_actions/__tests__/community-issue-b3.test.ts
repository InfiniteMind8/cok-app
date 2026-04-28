import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  createIssue: vi.fn(),
  createAttachment: vi.fn(),
  createAuditLog: vi.fn(),
  transaction: vi.fn(),
  notifyAllOfRole: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ requireRole: mocks.requireRole }))

vi.mock('@/lib/db', () => ({
  db: {
    issue: { create: mocks.createIssue },
    attachment: { create: mocks.createAttachment },
    auditLog: { create: mocks.createAuditLog },
    $transaction: mocks.transaction,
  },
}))

vi.mock('@/lib/notifications/service', () => ({
  notifyAllOfRole: mocks.notifyAllOfRole,
}))

import { raiseIssueAction } from '@/app/(resident)/_actions/community'

const RESIDENT = { id: 'resident-1', role: 'RESIDENT' }
const CREATED_ISSUE = { id: 'issue-1', category: 'Maintenance', seriousness: 'ORANGE' }

describe('raiseIssueAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireRole.mockResolvedValue(RESIDENT)
    mocks.transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        issue: { create: mocks.createIssue },
        attachment: { create: mocks.createAttachment },
        auditLog: { create: mocks.createAuditLog },
      }
      return fn(tx)
    })
    mocks.createIssue.mockResolvedValue(CREATED_ISSUE)
    mocks.createAttachment.mockResolvedValue({})
    mocks.createAuditLog.mockResolvedValue({})
    mocks.notifyAllOfRole.mockResolvedValue(undefined)
  })

  it('requires RESIDENT or VISITOR role', async () => {
    mocks.requireRole.mockRejectedValueOnce(new Error('Forbidden'))
    await expect(
      raiseIssueAction({ seriousness: 'ORANGE', urgency: 'ORANGE', category: 'Maintenance', message: 'Broken pipe' }),
    ).rejects.toThrow('Forbidden')
    expect(mocks.requireRole).toHaveBeenCalledWith(['RESIDENT', 'VISITOR'])
  })

  it('throws when message is empty', async () => {
    await expect(
      raiseIssueAction({ seriousness: 'ORANGE', urgency: 'ORANGE', category: 'Maintenance', message: '' }),
    ).rejects.toThrow('Message is required')
  })

  it('throws when category is empty', async () => {
    await expect(
      raiseIssueAction({ seriousness: 'ORANGE', urgency: 'ORANGE', category: '', message: 'Some message here' }),
    ).rejects.toThrow('Category is required')
  })

  it('creates issue with title and location when provided', async () => {
    await raiseIssueAction({
      seriousness: 'RED',
      urgency: 'ORANGE',
      category: 'Security',
      message: 'Gate is broken and cannot be closed',
      title: 'Broken gate',
      location: 'North entrance',
    })
    expect(mocks.createIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'Broken gate',
          location: 'North entrance',
          seriousness: 'RED',
          urgency: 'ORANGE',
          reporterId: 'resident-1',
        }),
      }),
    )
  })

  it('writes an audit log entry inside the transaction', async () => {
    await raiseIssueAction({
      seriousness: 'YELLOW',
      urgency: 'YELLOW',
      category: 'Noise',
      message: 'Loud music every evening',
    })
    expect(mocks.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'RAISE_ISSUE',
          entity: 'Issue',
          actorId: 'resident-1',
        }),
      }),
    )
  })

  it('does not create Attachment rows when no attachments provided', async () => {
    await raiseIssueAction({
      seriousness: 'YELLOW',
      urgency: 'YELLOW',
      category: 'Cleanliness',
      message: 'Rubbish near block entrance',
    })
    expect(mocks.createAttachment).not.toHaveBeenCalled()
  })

  it('creates Attachment rows for each provided photo/video', async () => {
    await raiseIssueAction({
      seriousness: 'ORANGE',
      urgency: 'ORANGE',
      category: 'Maintenance',
      message: 'Cracked pavement outside block 4',
      attachments: [
        { storageKey: 'https://cdn.ut.io/photo1.jpg', mimeType: 'image/jpeg', sizeBytes: 2048, name: 'photo1.jpg', fieldName: 'photo' },
        { storageKey: 'https://cdn.ut.io/video.mp4', mimeType: 'video/mp4', sizeBytes: 10240, name: 'video.mp4', fieldName: 'video' },
      ],
    })
    expect(mocks.createAttachment).toHaveBeenCalledTimes(2)
    expect(mocks.createAttachment).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ fieldName: 'photo', entityId: CREATED_ISSUE.id }) }),
    )
    expect(mocks.createAttachment).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ fieldName: 'video', entityId: CREATED_ISSUE.id }) }),
    )
  })

  it('stores contactPreference when provided', async () => {
    await raiseIssueAction({
      seriousness: 'YELLOW',
      urgency: 'YELLOW',
      category: 'Other',
      message: 'A general note about the community',
      contactPreference: 'Email',
    })
    expect(mocks.createIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ contactPreference: 'Email' }),
      }),
    )
  })

  it('sends admin notification after issue is created', async () => {
    await raiseIssueAction({
      seriousness: 'RED',
      urgency: 'RED',
      category: 'Security',
      message: 'Unauthorised person spotted in restricted zone',
      title: 'Security breach',
    })
    expect(mocks.notifyAllOfRole).toHaveBeenCalledWith(
      ['MASTER_ADMIN', 'ADMIN'],
      expect.objectContaining({ type: 'ISSUE_RAISED' }),
    )
  })

  it('does not fail if admin notification throws', async () => {
    mocks.notifyAllOfRole.mockRejectedValueOnce(new Error('Notification service down'))
    await expect(
      raiseIssueAction({ seriousness: 'YELLOW', urgency: 'YELLOW', category: 'Noise', message: 'Loud party downstairs' }),
    ).resolves.not.toThrow()
  })
})

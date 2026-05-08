import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock db ────────────────────────────────────────────────────────────────

vi.mock('@/lib/db', () => ({
  db: {
    visitorGroup: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    visitorGroupMembership: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

// requireRole mock returns a fake admin
vi.mock('@/lib/auth', () => ({
  requireRole: vi.fn().mockResolvedValue({ id: 'admin-1', role: 'MASTER_ADMIN' }),
}))

import { db } from '@/lib/db'
import {
  createGroupAction,
  archiveGroupAction,
  assignMemberAction,
  removeMemberAction,
} from '@/app/(admin)/_actions/visitor-groups'

const mockGroupCreate = db.visitorGroup.create as ReturnType<typeof vi.fn>
const mockGroupUpdate = db.visitorGroup.update as ReturnType<typeof vi.fn>
const mockGroupFindUnique = db.visitorGroup.findUnique as ReturnType<typeof vi.fn>
const mockMemberCreate = db.visitorGroupMembership.create as ReturnType<typeof vi.fn>
const mockMemberFindFirst = db.visitorGroupMembership.findFirst as ReturnType<typeof vi.fn>
const mockMemberUpdate = db.visitorGroupMembership.update as ReturnType<typeof vi.fn>
const mockAuditCreate = db.auditLog.create as ReturnType<typeof vi.fn>
const mockUserFindUnique = db.user.findUnique as ReturnType<typeof vi.fn>

beforeEach(() => vi.clearAllMocks())

// ─── createGroupAction ───────────────────────────────────────────────────────

describe('createGroupAction', () => {
  it('creates a group and writes an audit log', async () => {
    mockGroupFindUnique.mockResolvedValue(null) // no name conflict
    mockGroupCreate.mockResolvedValue({ id: 'group-1', name: 'Training A', theme: null })
    mockAuditCreate.mockResolvedValue({})

    await createGroupAction({ name: 'Training A', description: 'Corporate cohort' })

    expect(mockGroupCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: 'Training A' }),
      }),
    )
    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'CREATE', entity: 'VisitorGroup' }),
      }),
    )
  })

  it('throws if name is blank', async () => {
    await expect(createGroupAction({ name: '  ', description: 'test' })).rejects.toThrow(
      'Group name is required',
    )
    expect(mockGroupCreate).not.toHaveBeenCalled()
  })

  it('throws if name already exists', async () => {
    mockGroupFindUnique.mockResolvedValue({ id: 'existing', name: 'Training A' })

    await expect(
      createGroupAction({ name: 'Training A', description: 'Another cohort' }),
    ).rejects.toThrow('A group with that name already exists')
  })
})

// ─── archiveGroupAction ──────────────────────────────────────────────────────

describe('archiveGroupAction', () => {
  it('sets archived=true and writes audit log', async () => {
    mockGroupFindUnique.mockResolvedValue({ id: 'group-1', name: 'Training A' })
    mockGroupUpdate.mockResolvedValue({ id: 'group-1', archived: true })
    mockAuditCreate.mockResolvedValue({})

    await archiveGroupAction('group-1')

    expect(mockGroupUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { archived: true } }),
    )
    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'ARCHIVE' }),
      }),
    )
  })

  it('throws if group not found', async () => {
    mockGroupFindUnique.mockResolvedValue(null)
    await expect(archiveGroupAction('ghost')).rejects.toThrow('Group not found')
  })
})

// ─── assignMemberAction ──────────────────────────────────────────────────────

describe('assignMemberAction', () => {
  it('creates a membership when none exists', async () => {
    mockGroupFindUnique.mockResolvedValue({ id: 'group-1', name: 'Training A', archived: false })
    mockUserFindUnique.mockResolvedValue({ id: 'visitor-1', role: 'VISITOR' })
    mockMemberFindFirst.mockResolvedValue(null) // no existing active membership
    mockMemberCreate.mockResolvedValue({ id: 'mem-1', groupId: 'group-1', userId: 'visitor-1' })
    mockAuditCreate.mockResolvedValue({})

    await assignMemberAction('group-1', 'visitor-1')

    expect(mockMemberCreate).toHaveBeenCalled()
    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'ASSIGN_MEMBER' }),
      }),
    )
  })

  it('throws if user is not a VISITOR', async () => {
    mockGroupFindUnique.mockResolvedValue({ id: 'group-1', name: 'Training A', archived: false })
    mockUserFindUnique.mockResolvedValue({ id: 'resident-1', role: 'RESIDENT' })

    await expect(assignMemberAction('group-1', 'resident-1')).rejects.toThrow(
      'Only visitors can be assigned to visitor groups',
    )
  })

  it('throws if membership already active', async () => {
    mockGroupFindUnique.mockResolvedValue({ id: 'group-1', name: 'Training A', archived: false })
    mockUserFindUnique.mockResolvedValue({ id: 'visitor-1', role: 'VISITOR' })
    mockMemberFindFirst.mockResolvedValue({ id: 'mem-1', removedAt: null })

    await expect(assignMemberAction('group-1', 'visitor-1')).rejects.toThrow(
      'User is already a member',
    )
  })

  it('throws if group is archived', async () => {
    mockGroupFindUnique.mockResolvedValue({ id: 'group-1', name: 'Training A', archived: true })

    await expect(assignMemberAction('group-1', 'visitor-1')).rejects.toThrow(
      'Cannot assign members to an archived group',
    )
  })
})

// ─── removeMemberAction ──────────────────────────────────────────────────────

describe('removeMemberAction', () => {
  it('sets removedAt to now', async () => {
    const membership = { id: 'mem-1', groupId: 'group-1', removedAt: null }
    const mockMemberFindUniqueLocal = vi.fn().mockResolvedValue(membership)
    ;(db.visitorGroupMembership as unknown as Record<string, unknown>).findUnique =
      mockMemberFindUniqueLocal
    mockMemberUpdate.mockResolvedValue({ ...membership, removedAt: new Date() })
    mockAuditCreate.mockResolvedValue({})

    await removeMemberAction('mem-1')

    expect(mockMemberUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ removedAt: expect.any(Date) }),
      }),
    )
  })
})

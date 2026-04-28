'use server'

import { requireRole } from '@/lib/auth'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

async function writeAuditLog(
  actorId: string,
  action: string,
  entity: string,
  entityId: string,
  before?: object,
  after?: object,
) {
  await db.auditLog.create({
    data: { action, entity, entityId, actorId, before: before ?? undefined, after: after ?? undefined },
  })
}

export async function createGroupAction(input: {
  name: string
  theme?: string
  description: string
}) {
  const admin = await requireRole(['MASTER_ADMIN', 'ADMIN'])

  if (!input.name.trim()) throw new Error('Group name is required')
  if (!input.description.trim()) throw new Error('Description is required')

  const existing = await db.visitorGroup.findUnique({ where: { name: input.name.trim() } })
  if (existing) throw new Error('A group with that name already exists')

  const group = await db.visitorGroup.create({
    data: {
      name: input.name.trim(),
      theme: input.theme?.trim() || null,
      description: input.description.trim(),
      createdById: admin.id,
    },
  })

  await writeAuditLog(admin.id, 'CREATE', 'VisitorGroup', group.id, undefined, {
    name: group.name,
    theme: group.theme,
  })

  revalidatePath('/admin/visitors/groups')
  return group
}

export async function editGroupAction(
  id: string,
  input: { name: string; theme?: string; description: string },
) {
  const admin = await requireRole(['MASTER_ADMIN', 'ADMIN'])

  const existing = await db.visitorGroup.findUnique({ where: { id } })
  if (!existing) throw new Error('Group not found')

  if (!input.name.trim()) throw new Error('Group name is required')

  const nameConflict = await db.visitorGroup.findFirst({
    where: { name: input.name.trim(), NOT: { id } },
  })
  if (nameConflict) throw new Error('A group with that name already exists')

  const updated = await db.visitorGroup.update({
    where: { id },
    data: {
      name: input.name.trim(),
      theme: input.theme?.trim() || null,
      description: input.description.trim(),
    },
  })

  await writeAuditLog(admin.id, 'UPDATE', 'VisitorGroup', id, { name: existing.name }, { name: updated.name })

  revalidatePath('/admin/visitors/groups')
  revalidatePath(`/admin/visitors/groups/${id}`)
  return updated
}

export async function archiveGroupAction(id: string) {
  const admin = await requireRole(['MASTER_ADMIN', 'ADMIN'])

  const group = await db.visitorGroup.findUnique({ where: { id } })
  if (!group) throw new Error('Group not found')

  await db.visitorGroup.update({ where: { id }, data: { archived: true } })

  await writeAuditLog(admin.id, 'ARCHIVE', 'VisitorGroup', id, { archived: false }, { archived: true })

  revalidatePath('/admin/visitors/groups')
}

export async function unarchiveGroupAction(id: string) {
  const admin = await requireRole(['MASTER_ADMIN', 'ADMIN'])

  await db.visitorGroup.update({ where: { id }, data: { archived: false } })

  await writeAuditLog(admin.id, 'UNARCHIVE', 'VisitorGroup', id, { archived: true }, { archived: false })

  revalidatePath('/admin/visitors/groups')
}

export async function assignMemberAction(groupId: string, userId: string) {
  const admin = await requireRole(['MASTER_ADMIN', 'ADMIN'])

  const group = await db.visitorGroup.findUnique({ where: { id: groupId } })
  if (!group) throw new Error('Group not found')
  if (group.archived) throw new Error('Cannot assign members to an archived group')

  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('User not found')
  if (user.role !== 'VISITOR') throw new Error('Only visitors can be assigned to visitor groups')

  // Check for existing active membership
  const existing = await db.visitorGroupMembership.findFirst({
    where: { groupId, userId, removedAt: null },
  })
  if (existing) throw new Error('User is already a member of this group')

  const membership = await db.visitorGroupMembership.create({
    data: { groupId, userId, assignedById: admin.id },
  })

  await writeAuditLog(admin.id, 'ASSIGN_MEMBER', 'VisitorGroupMembership', membership.id, undefined, {
    groupId,
    userId,
  })

  revalidatePath(`/admin/visitors/groups/${groupId}`)
  revalidatePath('/admin/accounts')
}

export async function removeMemberAction(membershipId: string) {
  const admin = await requireRole(['MASTER_ADMIN', 'ADMIN'])

  const membership = await db.visitorGroupMembership.findUnique({ where: { id: membershipId } })
  if (!membership) throw new Error('Membership not found')
  if (membership.removedAt) throw new Error('Membership already removed')

  await db.visitorGroupMembership.update({
    where: { id: membershipId },
    data: { removedAt: new Date() },
  })

  await writeAuditLog(admin.id, 'REMOVE_MEMBER', 'VisitorGroupMembership', membershipId, {
    removedAt: null,
  }, {
    removedAt: new Date().toISOString(),
  })

  revalidatePath(`/admin/visitors/groups/${membership.groupId}`)
}

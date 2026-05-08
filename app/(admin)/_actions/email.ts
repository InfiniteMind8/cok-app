'use server'

import { withAdminAction, type AuthUser } from '@/lib/action'
import { resendEmailById } from '@/lib/email/service'
import { revalidatePath } from 'next/cache'

async function _resendEmailAction(_actor: AuthUser, logId: string) {
  const result = await resendEmailById(logId)
  revalidatePath('/admin/email-log')
  return result
}

export const resendEmailAction = withAdminAction(_resendEmailAction, { roles: ['MASTER_ADMIN'] })

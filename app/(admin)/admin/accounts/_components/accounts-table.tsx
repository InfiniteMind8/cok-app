'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/admin/empty-state'
import { KAmount } from '@/components/admin/k-amount'
import { AccountActions } from './account-actions'
import { AccountDetailDrawer } from './account-detail-drawer'
import { Prisma } from '@prisma/client'

interface UserRow {
  id: string
  fullName: string
  email: string
  memberId: string
  role: string
  status: string
  profilePhotoUrl: string | null
  createdAt: Date
  walletBalance: Prisma.Decimal | null
  kyc: Record<string, string> | null
}

interface AccountsTableProps {
  users: UserRow[]
}

const roleLabel: Record<string, string> = {
  MASTER_ADMIN: 'Master Admin',
  ADMIN: 'Admin',
  RESIDENT: 'Resident',
  VENDOR: 'Vendor',
  VISITOR: 'Visitor',
}

const statusDot: Record<string, string> = {
  ACTIVE: 'bg-status-green',
  SUSPENDED: 'bg-status-red',
  PENDING_KYC: 'bg-status-yellow',
}

export function AccountsTable({ users }: AccountsTableProps) {
  const [drawerUser, setDrawerUser] = useState<UserRow | null>(null)

  if (users.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No members found"
        body="Members matching these filters will appear here."
      />
    )
  }

  return (
    <>
      <div className="bg-white border border-karis-stone-100 rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-karis-stone-50">
              <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">
                Member
              </TableHead>
              <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">
                Member ID
              </TableHead>
              <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">
                Role
              </TableHead>
              <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">
                Status
              </TableHead>
              <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500 text-right">
                Balance
              </TableHead>
              <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">
                Joined
              </TableHead>
              <TableHead className="px-5 font-body text-xs uppercase tracking-wider text-karis-stone-500">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => {
              const initials = u.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
              return (
                <TableRow key={u.id}>
                  <TableCell className="px-5">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 shrink-0">
                        {u.profilePhotoUrl && <AvatarImage src={u.profilePhotoUrl} alt={u.fullName} />}
                        <AvatarFallback className="bg-karis-green-900 text-white text-xs font-body">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-body text-sm text-karis-stone-900 truncate">{u.fullName}</p>
                        <p className="font-body text-xs text-karis-stone-500 truncate">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-5 font-body text-xs text-karis-stone-500 tabular-nums">
                    {u.memberId}
                  </TableCell>
                  <TableCell className="px-5">
                    <Badge
                      variant="secondary"
                      className="font-body text-xs bg-karis-stone-100 text-karis-stone-700"
                    >
                      {roleLabel[u.role] ?? u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-5">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${statusDot[u.status] ?? 'bg-karis-stone-300'}`} />
                      <span className="font-body text-xs text-karis-stone-700">
                        {u.status.replace('_', ' ')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-5 text-right">
                    {u.walletBalance !== null ? (
                      <KAmount amount={u.walletBalance} />
                    ) : (
                      <span className="text-xs font-body text-karis-stone-300">—</span>
                    )}
                  </TableCell>
                  <TableCell className="px-5 font-body text-sm text-karis-stone-500">
                    {format(u.createdAt, 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell className="px-5">
                    <AccountActions
                      userId={u.id}
                      userName={u.fullName}
                      status={u.status}
                      role={u.role}
                      onView={() => setDrawerUser(u)}
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <AccountDetailDrawer
        open={!!drawerUser}
        onClose={() => setDrawerUser(null)}
        user={drawerUser}
      />
    </>
  )
}

import { ComingSoonCard } from '../_components/coming-soon-card'

export default function DemoAdminPage() {
  return (
    <ComingSoonCard
      persona="Admin"
      surfaces={[
        'Scoped operational dashboard',
        'Approvals queue (filtered to admin scope)',
        'Residents list with quick actions',
        'Audit Log',
      ]}
    />
  )
}

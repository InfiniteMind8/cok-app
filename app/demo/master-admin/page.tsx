import { ComingSoonCard } from '../_components/coming-soon-card'

export default function DemoMasterAdminPage() {
  return (
    <ComingSoonCard
      persona="Master Admin"
      surfaces={[
        'Dashboard with treasury reserve and community fund hero cards',
        'Treasury (deposits, settlements, adjustments, reconciliation report)',
        'Approvals Centre — four tabs (settlements, transfers, vouchers, rental extensions)',
        'Data Directory with sample resident drill-in',
        'Audit Log Viewer with JSON diff inspector',
        'Settings — Currency conversion + active promotions',
        'Emergency Broadcast composer',
        'Email Log',
      ]}
    />
  )
}

import { ComingSoonCard } from '../_components/coming-soon-card'

export default function DemoVendorPage() {
  return (
    <ComingSoonCard
      persona="Vendor"
      surfaces={[
        'Vendor dashboard',
        'Sales / payments list',
        'Profile',
      ]}
    />
  )
}

import { ComingSoonCard } from '../_components/coming-soon-card'

export default function DemoVisitorPage() {
  return (
    <ComingSoonCard
      persona="Visitor"
      surfaces={[
        'Visitor dashboard',
        'My Visitor Groups',
        'Filtered announcements',
        'Issue reports list',
        'Profile',
        'Lockdown panel — what visitors cannot do (proves §3.2 boundaries visually)',
      ]}
    />
  )
}

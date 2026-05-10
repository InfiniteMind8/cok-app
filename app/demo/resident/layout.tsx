import { DemoResidentTabBar } from './_components/demo-resident-tab-bar'

export default function DemoResidentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 pb-20">
      {children}
      <DemoResidentTabBar />
    </div>
  )
}

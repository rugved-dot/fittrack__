import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/data'
import BottomNav from '@/components/layout/BottomNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile()
  if (!profile) {
    redirect('/onboarding')
  }
  return (
    <div className="flex flex-col min-h-screen max-w-[480px] mx-auto">
      <main className="flex-1 pb-20 overflow-y-auto">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}

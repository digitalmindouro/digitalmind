import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { StoreProvider } from '@/components/StoreProvider'
import { HydrateOnMount } from '@/components/HydrateOnMount'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supa = await createClient()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) redirect('/login')

  return (
    <StoreProvider>
      <HydrateOnMount />
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <Topbar />
          <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6">
            {children}
          </main>
        </div>
      </div>
      <MobileBottomNav />
    </StoreProvider>
  )
}

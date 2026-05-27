'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useStore } from '@/lib/state/store'

// Syncs Supabase auth session into Zustand on mount and on auth state changes
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const setUser = useStore(s => s.setUser)
  const setCompanyId = useStore(s => s.setCompanyId)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const supa = createClient()

    // Initial session load
    supa.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return
      setUser(session.user)

      const { data } = await supa
        .from('companies')
        .select('id')
        .eq('owner_user_id', session.user.id)
        .single()

      if (data?.id) setCompanyId(data.id)
    })

    // Keep in sync on token refresh / sign-out
    const { data: { subscription } } = supa.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [setUser, setCompanyId])

  return <>{children}</>
}

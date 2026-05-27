import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Root() {
  const supa = await createClient()
  const { data: { user } } = await supa.auth.getUser()
  redirect(user ? '/dashboard' : '/login')
}

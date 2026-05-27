import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { ContentCalendar, MktGoals } from '@/types/app'
import { patchIntelligence } from './persist'

type Supa = SupabaseClient<Database>

export async function persistCalendar(supa: Supa, companyId: string, cal: ContentCalendar): Promise<void> {
  await patchIntelligence(supa, companyId, { contentCalendar: cal as unknown as Record<string, unknown> })
}

export async function persistMktGoals(supa: Supa, companyId: string, goals: MktGoals): Promise<void> {
  await patchIntelligence(supa, companyId, { mktGoals: goals as unknown as Record<string, unknown> })
}

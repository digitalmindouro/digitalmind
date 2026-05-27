import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { EvoEntry } from '@/types/app'

type Supa = SupabaseClient<Database>

export async function saveEvoEntry(supa: Supa, companyId: string, entry: EvoEntry): Promise<void> {
  await supa.from('company_evo_history').upsert({
    company_id: companyId,
    month: entry.month,
    year:  entry.year,
    score: entry.score,
    label: entry.label || '',
  })
}

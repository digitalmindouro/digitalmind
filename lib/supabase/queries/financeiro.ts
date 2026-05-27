import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { Transaction } from '@/types/app'

type Supa = SupabaseClient<Database>

export interface TransactionInput {
  tipo: 'receita' | 'despesa'
  desc: string
  valor: number
  cat: string
  dataISO: string           // "YYYY-MM-DD"
  clienteId: string | null
  produtoId: string | null
}

export async function insertTransaction(
  supa: Supa,
  companyId: string,
  userId: string,
  input: TransactionInput,
): Promise<Transaction | null> {
  const { data, error } = await supa
    .from('financial_transactions')
    .insert({
      company_id:      companyId,
      user_id:         userId,
      tipo:            input.tipo,
      descricao:       input.desc,
      valor:           input.valor,
      categoria:       input.cat || null,
      contact_id:      input.clienteId,
      product_id:      input.produtoId,
      data_lancamento: input.dataISO,
    })
    .select('id')
    .single()

  if (error || !data) return null

  return {
    id:          data.id,
    tipo:        input.tipo,
    desc:        input.desc,
    valor:       input.valor,
    cat:         input.cat,
    data:        new Date(input.dataISO + 'T00:00:00').toLocaleDateString('pt-BR'),
    dataISO:     input.dataISO,
    clienteId:   input.clienteId,
    fornecedorId: null,
    produtoId:   input.produtoId,
  }
}

export async function deleteTransaction(supa: Supa, id: string): Promise<void> {
  await supa.from('financial_transactions').delete().eq('id', id)
}

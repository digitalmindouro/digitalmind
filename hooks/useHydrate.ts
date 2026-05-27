'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useStore } from '@/lib/state/store'
import type { Transaction, Contact, Product, Categories, EvoEntry } from '@/types/app'

export function useHydrate() {
  const store = useStore()
  const hydrated = useRef(false)

  useEffect(() => {
    if (hydrated.current || !store.companyId || !store.user) return
    hydrated.current = true

    async function hydrate() {
      const supa = createClient()
      const companyId = store.companyId!

      // 1. Transações financeiras — sempre da tabela relacional
      const { data: txData } = await supa
        .from('financial_transactions')
        .select('*')
        .eq('company_id', companyId)
        .order('data_lancamento', { ascending: false })

      if (txData) {
        const txns: Transaction[] = txData.map(r => ({
          id: r.id,
          tipo: r.tipo as 'receita' | 'despesa',
          desc: r.descricao,
          valor: r.valor,
          cat: r.categoria ?? '',
          data: r.data_lancamento
            ? new Date(r.data_lancamento + 'T00:00:00')
                .toLocaleDateString('pt-BR')
            : '',
          dataISO: r.data_lancamento ?? '',
          clienteId: r.contact_id ?? null,
          fornecedorId: null,
          produtoId: r.product_id ?? null,
        }))
        store.setTransactions(txns)
      }

      // 2. Contacts e Products
      const [{ data: contData }, { data: prodData }] = await Promise.all([
        supa.from('contacts').select('*').eq('company_id', companyId),
        supa.from('products').select('*').eq('company_id', companyId),
      ])

      if (contData) {
        store.setContacts(contData.map(r => ({
          id: r.id,
          nome: r.nome,
          contato: r.contato ?? '',
          tipo: r.tipo as 'cliente' | 'fornecedor',
        })))
      }

      if (prodData) {
        store.setProducts(prodData.map(r => ({
          id: r.id,
          nome: r.nome,
          preco: r.preco,
          cat: r.cat ?? '',
        })))
      }

      // 3. company_intelligence (calendário, leads, metas, etc)
      const { data: intel } = await supa
        .from('company_intelligence')
        .select('ai_context')
        .eq('company_id', companyId)
        .single()

      if (intel?.ai_context) {
        const ctx = intel.ai_context as Record<string, unknown>

        if (ctx.contentCalendar) store.setContentCalendar(ctx.contentCalendar as never)
        if (ctx.salesGoals) store.setSalesGoals(ctx.salesGoals as never)
        if (ctx.salesLeads) store.setSalesLeads(ctx.salesLeads as never)
        if (ctx.mktGoals) store.setMktGoals(ctx.mktGoals as never)
        if (ctx.finMeta) store.setFinMeta(ctx.finMeta as number)
        if (ctx.categories) store.setCategories(ctx.categories as Categories)
        if (ctx.diag) store.setDiag(ctx.diag as never)
        if (ctx.salesProfile) store.setSalesProfile(ctx.salesProfile as never)
        if (ctx.salesAnswers) store.setSalesAnswers(ctx.salesAnswers as string[])
        if (ctx.formData) store.setFormData(ctx.formData as never)
      }

      // 4. Histórico de evolução
      const { data: evoData } = await supa
        .from('company_evo_history')
        .select('*')
        .eq('company_id', companyId)
        .order('year', { ascending: true })
        .order('month', { ascending: true })

      if (evoData) {
        const history: EvoEntry[] = evoData.map(r => ({
          month: r.month,
          year: r.year,
          score: r.score,
          label: r.label ?? '',
        }))
        store.setEvoHistory(history)
      }

      // 5. Diagnóstico mais recente (tabela company_diagnostics)
      const { data: diagData } = await supa
        .from('company_diagnostics')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (diagData?.ai_output && !store.diag) {
        store.setDiag(diagData.ai_output as never)
      }
    }

    hydrate().catch(console.error)
  }, [store.companyId, store.user]) // eslint-disable-line react-hooks/exhaustive-deps
}

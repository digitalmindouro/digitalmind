'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { insertTransaction } from '@/lib/supabase/queries/financeiro'
import { patchIntelligence } from '@/lib/supabase/queries/persist'
import { useStore } from '@/lib/state/store'
import { toISODate } from '@/lib/utils/formatters'
import type { Categories, Contact, Product } from '@/types/app'

interface Props {
  categories: Categories
  contacts: Contact[]
  products: Product[]
  companyId: string
  userId: string
  onClose: () => void
}

export function TransactionForm({ categories, contacts, products, companyId, userId, onClose }: Props) {
  const addTransaction  = useStore(s => s.addTransaction)
  const setCategories   = useStore(s => s.setCategories)
  const storeCategories = useStore(s => s.categories)

  const [tipo, setTipo]         = useState<'receita' | 'despesa'>('receita')
  const [desc, setDesc]         = useState('')
  const [valorRaw, setValorRaw] = useState('')
  const [cat, setCat]           = useState('')
  const [dataISO, setDataISO]   = useState(toISODate(new Date()))
  const [clienteId, setClienteId] = useState('')
  const [produtoId, setProdutoId] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const valor = parseFloat(valorRaw.replace(',', '.'))
  const catList = tipo === 'receita' ? categories.receita : categories.despesa
  const clientes    = contacts.filter(c => c.tipo === 'cliente')
  const fornecedores = contacts.filter(c => c.tipo === 'fornecedor')
  const contactList = tipo === 'receita' ? clientes : fornecedores

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!desc.trim()) { setError('Descrição obrigatória.'); return }
    if (isNaN(valor) || valor <= 0) { setError('Valor inválido.'); return }

    setLoading(true)
    setError('')

    const supa = createClient()
    const txn = await insertTransaction(supa, companyId, userId, {
      tipo,
      desc: desc.trim(),
      valor,
      cat: cat.trim(),
      dataISO,
      clienteId: clienteId || null,
      produtoId: produtoId || null,
    })

    if (!txn) {
      setError('Erro ao salvar. Tente novamente.')
      setLoading(false)
      return
    }

    // Add new category to the store + persist if it's new
    if (cat.trim() && !catList.includes(cat.trim())) {
      const updated: Categories = {
        ...storeCategories,
        [tipo]: [...(storeCategories[tipo] ?? []), cat.trim()],
      }
      setCategories(updated)
      await patchIntelligence(supa, companyId, { categories: updated })
    }

    addTransaction(txn)
    onClose()
  }

  const tipoColor = tipo === 'receita' ? '#10b981' : '#ef4444'

  return (
    <div className="rounded-xl p-5 space-y-4"
         style={{ background: 'var(--surface)', border: `1px solid ${tipoColor}40` }}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Nova transação</h3>
        <button onClick={onClose} className="text-sm" style={{ color: 'var(--muted)' }}>✕</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Tipo toggle */}
        <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {(['receita', 'despesa'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTipo(t)}
              className="flex-1 py-2 text-sm font-semibold transition-colors capitalize"
              style={{
                background: tipo === t ? (t === 'receita' ? '#10b981' : '#ef4444') : 'var(--surface-2)',
                color: tipo === t ? '#fff' : 'var(--muted)',
              }}
            >
              {t === 'receita' ? '↑ Receita' : '↓ Despesa'}
            </button>
          ))}
        </div>

        {error && (
          <p className="text-xs text-red-400 px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,.1)' }}>
            {error}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          {/* Valor */}
          <div className="space-y-1">
            <label className="text-xs" style={{ color: 'var(--muted)' }}>Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={valorRaw}
              onChange={e => setValorRaw(e.target.value)}
              placeholder="0,00"
              required
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
          </div>

          {/* Data */}
          <div className="space-y-1">
            <label className="text-xs" style={{ color: 'var(--muted)' }}>Data</label>
            <input
              type="date"
              value={dataISO}
              onChange={e => setDataISO(e.target.value)}
              required
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
          </div>
        </div>

        {/* Descrição */}
        <div className="space-y-1">
          <label className="text-xs" style={{ color: 'var(--muted)' }}>Descrição</label>
          <input
            type="text"
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder={tipo === 'receita' ? 'Ex: Venda de produto X' : 'Ex: Aluguel do escritório'}
            required
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Categoria */}
          <div className="space-y-1">
            <label className="text-xs" style={{ color: 'var(--muted)' }}>Categoria</label>
            <input
              list="cat-suggestions"
              value={cat}
              onChange={e => setCat(e.target.value)}
              placeholder="Ex: Serviços"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
            <datalist id="cat-suggestions">
              {catList.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>

          {/* Contato */}
          <div className="space-y-1">
            <label className="text-xs" style={{ color: 'var(--muted)' }}>
              {tipo === 'receita' ? 'Cliente' : 'Fornecedor'}
            </label>
            <select
              value={clienteId}
              onChange={e => setClienteId(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: clienteId ? 'var(--text)' : 'var(--muted)' }}
            >
              <option value="">Selecionar...</option>
              {contactList.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
        </div>

        {/* Produto (opcional) */}
        {products.length > 0 && (
          <div className="space-y-1">
            <label className="text-xs" style={{ color: 'var(--muted)' }}>Produto (opcional)</label>
            <select
              value={produtoId}
              onChange={e => setProdutoId(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: produtoId ? 'var(--text)' : 'var(--muted)' }}
            >
              <option value="">Nenhum</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: tipoColor }}
          >
            {loading ? 'Salvando...' : `Lançar ${tipo}`}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 rounded-lg text-sm"
            style={{ color: 'var(--muted)', border: '1px solid var(--border)' }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}

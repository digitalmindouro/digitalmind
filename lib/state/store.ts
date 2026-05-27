'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  DiagResult, FormData, Transaction, Contact, Product,
  SalesProfile, CrmLead, ContentCalendar, MktGoals,
  SalesGoal, EvoEntry, Categories,
} from '@/types/app'
import type { User } from '@supabase/supabase-js'

export interface AppState {
  // Auth
  user: User | null
  isLogged: boolean
  connected: boolean
  companyId: string | null

  // Navegação
  activeMod: 'onboarding' | 'diagnostico' | 'marketing' | 'vendas' | 'financeiro' | 'evolucao'

  // Diagnóstico
  diag: DiagResult | null
  formData: FormData
  formStep: number

  // Vendas
  salesProfile: SalesProfile | null
  salesAnswers: string[]
  salesStep: number
  salesLeads: CrmLead[]
  salesGoals: SalesGoal[]

  // Financeiro
  transactions: Transaction[]
  contacts: Contact[]
  products: Product[]
  categories: Categories
  finMeta: number | null
  conciliacao: unknown[]

  // Marketing
  contentCalendar: ContentCalendar
  mktGoals: MktGoals
  mktActiveTab: string

  // Evolução
  evoHistory: EvoEntry[]
  maturityRealScore: number
  businessStage: number | null

  // Calendário UI state
  calYear: number
  calMonth: number
  calSelectedDate: string | null
  calEditingId: string | null
  calEventFmt: string
  calEventPlat: string

  // Ações
  setUser: (user: User | null) => void
  setCompanyId: (id: string) => void
  setActiveMod: (mod: AppState['activeMod']) => void
  setDiag: (diag: DiagResult) => void
  setFormData: (data: Partial<FormData>) => void
  setFormStep: (step: number) => void
  setSalesProfile: (profile: SalesProfile | null) => void
  setSalesAnswers: (answers: string[]) => void
  setSalesStep: (step: number) => void
  setTransactions: (txns: Transaction[]) => void
  addTransaction: (txn: Transaction) => void
  removeTransaction: (id: string) => void
  setContacts: (contacts: Contact[]) => void
  addContact: (contact: Contact) => void
  removeContact: (id: string) => void
  setProducts: (products: Product[]) => void
  addProduct: (product: Product) => void
  removeProduct: (id: string) => void
  setCategories: (cats: Categories) => void
  setFinMeta: (meta: number | null) => void
  setContentCalendar: (cal: ContentCalendar) => void
  setMktGoals: (goals: MktGoals) => void
  setSalesLeads: (leads: CrmLead[]) => void
  upsertCrmLead: (lead: CrmLead) => void
  removeCrmLead: (id: string) => void
  setSalesGoals: (goals: SalesGoal[]) => void
  upsertSalesGoal: (goal: SalesGoal) => void
  removeSalesGoal: (id: string) => void
  setEvoHistory: (history: EvoEntry[]) => void
  setMaturityScore: (score: number) => void
  setBusinessStage: (stage: number) => void
  clearSession: () => void
}

const defaultFormData: FormData = {
  companyName: '', city: '', segment: '', marketTime: '',
  salesModel: '', mainGoal: '', mainDifficulty: '',
}

const now = new Date()

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Auth
      user: null,
      isLogged: false,
      connected: false,
      companyId: null,

      // Navegação
      activeMod: 'diagnostico',

      // Diagnóstico
      diag: null,
      formData: defaultFormData,
      formStep: 0,

      // Vendas
      salesProfile: null,
      salesAnswers: Array(10).fill(''),
      salesStep: 0,
      salesLeads: [],
      salesGoals: [],

      // Financeiro
      transactions: [],
      contacts: [],
      products: [],
      categories: { receita: [], despesa: [] },
      finMeta: null,
      conciliacao: [],

      // Marketing
      contentCalendar: {},
      mktGoals: {},
      mktActiveTab: 'agente',

      // Evolução
      evoHistory: [],
      maturityRealScore: 0,
      businessStage: null,

      // Calendário UI
      calYear: now.getFullYear(),
      calMonth: now.getMonth(),
      calSelectedDate: null,
      calEditingId: null,
      calEventFmt: 'post',
      calEventPlat: 'instagram',

      // Ações
      setUser: (user) => set({ user, isLogged: !!user }),
      setCompanyId: (id) => set({ companyId: id }),
      setActiveMod: (mod) => set({ activeMod: mod }),
      setDiag: (diag) => set({ diag }),
      setFormData: (data) => set((s) => ({ formData: { ...s.formData, ...data } })),
      setFormStep: (formStep) => set({ formStep }),
      setSalesProfile: (salesProfile) => set({ salesProfile }),
      setSalesAnswers: (salesAnswers) => set({ salesAnswers }),
      setSalesStep: (salesStep) => set({ salesStep }),
      setTransactions: (transactions) => set({ transactions }),
      addTransaction: (txn) => set((s) => ({ transactions: [...s.transactions, txn] })),
      removeTransaction: (id) => set((s) => ({ transactions: s.transactions.filter(t => t.id !== id) })),
      setContacts: (contacts) => set({ contacts }),
      addContact: (contact) => set((s) => ({ contacts: [...s.contacts, contact] })),
      removeContact: (id) => set((s) => ({ contacts: s.contacts.filter(c => c.id !== id) })),
      setProducts: (products) => set({ products }),
      addProduct: (product) => set((s) => ({ products: [...s.products, product] })),
      removeProduct: (id) => set((s) => ({ products: s.products.filter(p => p.id !== id) })),
      setCategories: (categories) => set({ categories }),
      setFinMeta: (finMeta) => set({ finMeta }),
      setContentCalendar: (contentCalendar) => set({ contentCalendar }),
      setMktGoals: (mktGoals) => set({ mktGoals }),
      setSalesLeads: (salesLeads) => set({ salesLeads }),
      upsertCrmLead: (lead) => set((s) => {
        const idx = s.salesLeads.findIndex(l => l.id === lead.id)
        if (idx >= 0) {
          const next = [...s.salesLeads]
          next[idx] = lead
          return { salesLeads: next }
        }
        return { salesLeads: [...s.salesLeads, lead] }
      }),
      removeCrmLead: (id) => set((s) => ({ salesLeads: s.salesLeads.filter(l => l.id !== id) })),
      setSalesGoals: (salesGoals) => set({ salesGoals }),
      upsertSalesGoal: (goal) => set((s) => {
        const idx = s.salesGoals.findIndex(g => g.id === goal.id)
        if (idx >= 0) {
          const next = [...s.salesGoals]
          next[idx] = goal
          return { salesGoals: next }
        }
        return { salesGoals: [...s.salesGoals, goal] }
      }),
      removeSalesGoal: (id) => set((s) => ({ salesGoals: s.salesGoals.filter(g => g.id !== id) })),
      setEvoHistory: (evoHistory) => set({ evoHistory }),
      setMaturityScore: (maturityRealScore) => set({ maturityRealScore }),
      setBusinessStage: (businessStage) => set({ businessStage }),

      clearSession: () => set({
        user: null, isLogged: false, connected: false, companyId: null,
        diag: null, formData: defaultFormData, formStep: 0,
        salesProfile: null, salesAnswers: Array(10).fill(''), salesStep: 0,
        salesLeads: [], salesGoals: [],
        transactions: [], contacts: [], products: [],
        categories: { receita: [], despesa: [] }, finMeta: null,
        contentCalendar: {}, mktGoals: {}, evoHistory: [],
        maturityRealScore: 0, businessStage: null,
        activeMod: 'diagnostico',
      }),
    }),
    {
      name: 'digitalmind-v2',
      // Não persiste dados de UI nem sessão de auth — Supabase gerencia a sessão
      partialize: (s) => ({
        formData: s.formData,
        formStep: s.formStep,
        activeMod: s.activeMod,
        calYear: s.calYear,
        calMonth: s.calMonth,
      }),
    }
  )
)

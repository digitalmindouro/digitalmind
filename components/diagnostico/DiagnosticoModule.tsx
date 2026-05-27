'use client'

import { useStore } from '@/lib/state/store'
import { FormDiagnostico } from './FormDiagnostico'
import { ResultadoDiag } from './ResultadoDiag'

export function DiagnosticoModule() {
  const diag = useStore(s => s.diag)

  return (
    <div className="max-w-2xl mx-auto px-0">
      {diag ? <ResultadoDiag result={diag} /> : <FormDiagnostico />}
    </div>
  )
}

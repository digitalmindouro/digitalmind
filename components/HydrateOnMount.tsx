'use client'

import { useHydrate } from '@/hooks/useHydrate'

export function HydrateOnMount() {
  useHydrate()
  return null
}

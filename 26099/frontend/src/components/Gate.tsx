/**
 * Visibility gates for the two view modes.
 *
 * Use these rather than scattering `mode === 'technical'` ternaries through page
 * bodies. When a section is hidden the layout must reflow to fill the space: a
 * Simple view with an empty right rail reads as broken, not as clean.
 */

import type { ReactNode } from 'react'
import { useViewMode } from '@/store/viewmode'

export function TechnicalOnly({ children }: { children: ReactNode }) {
  const technical = useViewMode(s => s.mode === 'technical')
  return technical ? <>{children}</> : null
}

export function SimpleOnly({ children }: { children: ReactNode }) {
  const simple = useViewMode(s => s.mode === 'simple')
  return simple ? <>{children}</> : null
}

/** Pick between two renderings without repeating the hook in every page. */
export function ByMode({ simple, technical }: { simple: ReactNode; technical: ReactNode }) {
  const mode = useViewMode(s => s.mode)
  return <>{mode === 'technical' ? technical : simple}</>
}

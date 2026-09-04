/**
 * Simple and Technical view modes.
 *
 * Simple answers "should this exist?". Technical answers "does this work?".
 * When a call is ambiguous, ask which of those two questions the element serves.
 *
 * Simple is the default because the first person to open the link is skimming.
 */

import { create } from 'zustand'

export type ViewMode = 'simple' | 'technical'

const STORAGE_KEY = 'nummf.view'

function initialMode(): ViewMode {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('view')
    if (fromUrl === 'technical' || fromUrl === 'simple') return fromUrl
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'technical' || stored === 'simple') return stored
  } catch {
    // Private browsing, disabled storage, or no window. Fall through to the default.
  }
  return 'simple'
}

interface ViewModeStore {
  mode: ViewMode
  setMode: (mode: ViewMode) => void
  toggle: () => void
}

export const useViewMode = create<ViewModeStore>((set, get) => ({
  mode: initialMode(),
  setMode: mode => {
    try {
      localStorage.setItem(STORAGE_KEY, mode)
    } catch {
      // Not being able to persist the preference is not worth failing the switch over.
    }
    set({ mode })
  },
  toggle: () => get().setMode(get().mode === 'simple' ? 'technical' : 'simple'),
}))

export function useIsTechnical(): boolean {
  return useViewMode(state => state.mode === 'technical')
}

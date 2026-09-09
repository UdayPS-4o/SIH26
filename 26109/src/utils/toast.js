import { useState, useCallback, useRef } from 'react'
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react'

const listeners = new Set()
let state = { toasts: [] }

function emit() {
  listeners.forEach((fn) => fn(state))
}

export function toast(options) {
  const id = Date.now() + Math.random()
  const toast = { id, ...options }
  const expires = options.duration ?? 4000
  state = { toasts: [...state.toasts, toast] }
  emit()
  if (expires > 0) {
    setTimeout(() => dismiss(id), expires)
  }
  return id
}

export function dismiss(id) {
  state = { toasts: state.toasts.filter((t) => t.id !== id) }
  emit()
}

export function ToastContainer() {
  const [, setTick] = useState(0)
  useRef(null)

  const refresh = useCallback(() => setTick((n) => n + 1), [])
  useState(() => {
    listeners.add(refresh)
    return () => listeners.delete(refresh)
  })

  if (!state.toasts.length) return null

  const toneIcon = {
    success: CheckCircle,
    warning: AlertTriangle,
    info: Info,
  }
  const toneCls = {
    success: 'border-forest-400 bg-forest-50 text-forest-800 dark:bg-forest-950 dark:text-forest-300',
    warning: 'border-honey-400 bg-honey-50 text-honey-800 dark:bg-honey-950 dark:text-honey-300',
    info: 'border-ai bg-ai/5 text-ai-dark dark:bg-ai/10 dark:text-ai',
  }

  return (
    <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 max-w-sm">
      {state.toasts.map((t) => {
        const Icon = toneIcon[t.type] || Info
        return (
          <div key={t.id} className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs shadow-lg animate-toast-in ${toneCls[t.type] || toneCls.info}`}>
            <Icon size={16} />
            <span className="flex-1 font-medium">{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="shrink-0 opacity-60 hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}

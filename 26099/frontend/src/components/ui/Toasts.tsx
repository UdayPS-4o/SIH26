/**
 * Global toast notification system.
 *
 * A toast is a brief confirmation that an action landed. It appears in the
 * bottom-right corner, auto-dismisses after 4 seconds, and can stack.
 *
 * Usage: call `toast.success('...')`, `toast.error('...')`, or `toast.info('...')`
 * from anywhere in the app. No provider wrapper needed — it mounts its own
 * container into a portal.
 */

import { useState, useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle, XCircle, Info } from '@phosphor-icons/react'
import { cx } from './tokens'

type ToastKind = 'positive' | 'negative' | 'info'

interface Toast {
  id: number
  kind: ToastKind
  message: string
  detail?: string
}

let globalToast: ((toast: Omit<Toast, 'id'>) => void) | null = null
let counter = 0

export function toast(kind: ToastKind, message: string, detail?: string) {
  if (globalToast) globalToast({ kind, message, detail })
}

export const toastSuccess = (message: string, detail?: string) => toast('positive', message, detail)
export const toastError = (message: string, detail?: string) => toast('negative', message, detail)
export const toastInfo = (message: string, detail?: string) => toast('info', message, detail)

const ICONS: Record<ToastKind, ReactNode> = {
  positive: <CheckCircle size={18} weight="fill" />,
  negative: <XCircle size={18} weight="fill" />,
  info: <Info size={18} weight="fill" />,
}

const TONE_CLASS: Record<ToastKind, string> = {
  positive: 'border-positive-edge bg-positive-bg text-positive',
  negative: 'border-negative-edge bg-negative-bg text-negative',
  info: 'border-info-edge bg-info-bg text-info',
}

export function Toasts() {
  const [items, setItems] = useState<Toast[]>([])

  useEffect(() => {
    globalToast = (toast) => {
      const id = ++counter
      setItems(prev => [...prev, { ...toast, id }])
      setTimeout(() => {
        setItems(prev => prev.filter(t => t.id !== id))
      }, 4000)
    }
    return () => { globalToast = null }
  }, [])

  if (items.length === 0) return null

  return createPortal(
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2" style={{ maxWidth: 380 }}>
      {items.map(item => (
        <div
          key={item.id}
          className={cx(
            'flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg',
            'animate-[slideIn_0.25s_ease-out]',
            TONE_CLASS[item.kind],
          )}
        >
          <span className="mt-0.5 shrink-0">{ICONS[item.kind]}</span>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold leading-snug">{item.message}</p>
            {item.detail && <p className="mt-0.5 text-[12px] opacity-80 leading-snug">{item.detail}</p>}
          </div>
        </div>
      ))}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>,
    document.body,
  )
}

import { CheckCircle2, Info, TriangleAlert } from 'lucide-react'
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'

type ToastTone = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  tone: ToastTone
}

interface ToastContextValue {
  toast: (message: string, tone?: ToastTone) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const ICONS = {
  success: CheckCircle2,
  error: TriangleAlert,
  info: Info,
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counter = useRef(0)

  const toast = useCallback((message: string, tone: ToastTone = 'success') => {
    counter.current += 1
    const id = counter.current
    setToasts((current) => [...current.slice(-2), { id, message, tone }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id))
    }, 3600)
  }, [])

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-[188px] z-[90] flex flex-col items-center gap-2 px-4 sm:bottom-[120px] sm:items-end sm:pr-6">
        {toasts.map((item) => {
          const Icon = ICONS[item.tone]
          return (
            <div
              key={item.id}
              className="animate-[rise_0.28s_ease-out] pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-xl border border-white/10 bg-[#1b1b1b]/95 px-3.5 py-2.5 text-[13px] text-neutral-100 shadow-[0_20px_40px_-28px_rgba(0,0,0,0.9)] backdrop-blur"
            >
              <Icon
                size={15}
                className={
                  item.tone === 'error'
                    ? 'text-red-400'
                    : item.tone === 'info'
                      ? 'text-neutral-400'
                      : 'text-brand'
                }
              />
              <span>{item.message}</span>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast debe usarse dentro de ToastProvider')
  return context
}

import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  width?: string
}

export function Modal({ open, onClose, title, description, children, footer, width = 'max-w-md' }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-3 sm:items-center sm:p-6">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`panel relative w-full ${width} animate-[rise_0.3s_cubic-bezier(0.2,0.8,0.2,1)] p-5 sm:p-6`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[17px] font-semibold text-white">{title}</h2>
            {description && <p className="mt-1 text-[12.5px] leading-relaxed text-neutral-400">{description}</p>}
          </div>
          <button onClick={onClose} className="icon-btn -mr-1 -mt-1" aria-label="Cerrar">
            <X size={17} />
          </button>
        </div>
        <div className="mt-5">{children}</div>
        {footer && <div className="mt-6 flex items-center justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )
}

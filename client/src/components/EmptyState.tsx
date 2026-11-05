import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="panel flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.025] text-neutral-500">
        <div className="absolute inset-0 rounded-2xl bg-brand/10 blur-xl" />
        <Icon size={22} className="relative text-brand/80" />
      </div>
      <div>
        <h3 className="text-[14px] font-semibold text-neutral-200">{title}</h3>
        <p className="mx-auto mt-1 max-w-sm text-[12px] leading-relaxed text-neutral-500">{description}</p>
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}

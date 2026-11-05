interface PresetMiniEqProps {
  bands: number[]
  className?: string
}

/** Pequeña firma visual del EQ de un preset. */
export function PresetMiniEq({ bands, className = '' }: PresetMiniEqProps) {
  return (
    <div className={`flex items-end gap-[2px] ${className}`} aria-hidden>
      {bands.map((gain, index) => {
        const height = Math.max(8, Math.min(100, 18 + (gain / 18) * 72))
        return (
          <span
            key={index}
            className={gain > 0.4 ? 'bg-brand/90' : gain < -0.4 ? 'bg-white/18' : 'bg-white/30'}
            style={{ height: `${height}%`, width: 2, borderRadius: 1 }}
          />
        )
      })}
    </div>
  )
}

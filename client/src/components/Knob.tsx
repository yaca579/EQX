import { useId, useRef } from 'react'
import { clamp } from '../lib/studio'

interface KnobProps {
  label: string
  value: number
  min?: number
  max?: number
  step?: number
  defaultValue?: number
  unit?: string
  size?: number
  bipolar?: boolean
  onChange: (value: number) => void
  formatValue?: (value: number) => string
}

const START_ANGLE = -135
const END_ANGLE = 135

function polar(cx: number, cy: number, radius: number, angle: number) {
  const rad = (angle * Math.PI) / 180
  return { x: cx + radius * Math.sin(rad), y: cy - radius * Math.cos(rad) }
}

function arc(cx: number, cy: number, radius: number, from: number, to: number) {
  const start = polar(cx, cy, radius, from)
  const end = polar(cx, cy, radius, to)
  const large = Math.abs(to - from) > 180 ? 1 : 0
  const sweep = to >= from ? 1 : 0
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${radius} ${radius} 0 ${large} ${sweep} ${end.x.toFixed(2)} ${end.y.toFixed(2)}`
}

export function Knob({
  label,
  value,
  min = -12,
  max = 12,
  step = 0.5,
  defaultValue = 0,
  unit = 'dB',
  size = 62,
  bipolar = true,
  onChange,
  formatValue,
}: KnobProps) {
  const gradientId = useId().replace(/:/g, '')
  const drag = useRef<{ y: number; value: number } | null>(null)

  const range = max - min
  const normalized = clamp((value - min) / range, 0, 1)
  const angle = START_ANGLE + normalized * (END_ANGLE - START_ANGLE)
  const zeroNormalized = bipolar ? clamp((0 - min) / range, 0, 1) : 0
  const zeroAngle = START_ANGLE + zeroNormalized * (END_ANGLE - START_ANGLE)

  const cx = 40
  const cy = 40
  const radius = 30

  const display = formatValue
    ? formatValue(value)
    : `${value > 0 && bipolar ? '+' : ''}${value.toFixed(1)}`

  const commit = (raw: number) => {
    const snapped = Math.round(raw / step) * step
    onChange(Math.min(max, Math.max(min, Number(snapped.toFixed(3)))))
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { y: event.clientY, value }
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return
    const delta = drag.current.y - event.clientY
    const sensitivity = event.shiftKey ? 0.25 : 1
    commit(drag.current.value + (delta / 170) * range * sensitivity)
  }

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    drag.current = null
  }

  return (
    <div className="flex select-none flex-col items-center gap-1.5">
      <div
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${display} ${unit}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDoubleClick={() => commit(defaultValue)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowUp' || event.key === 'ArrowRight') {
            event.preventDefault()
            commit(value + step * (event.shiftKey ? 4 : 1))
          }
          if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') {
            event.preventDefault()
            commit(value - step * (event.shiftKey ? 4 : 1))
          }
          if (event.key === 'Home') commit(defaultValue)
        }}
        className="group relative cursor-ns-resize touch-none rounded-full outline-none transition-transform active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-brand/60"
        style={{ width: size, height: size }}
        title={`${label} · doble clic para resetear`}
      >
        <svg viewBox="0 0 80 80" width={size} height={size} className="drop-shadow-[0_6px_14px_rgba(0,0,0,0.45)]">
          <defs>
            <linearGradient id={`knob-${gradientId}`} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#C24E00" />
              <stop offset="55%" stopColor="#FF6A00" />
              <stop offset="100%" stopColor="#FFB067" />
            </linearGradient>
            <radialGradient id={`face-${gradientId}`} cx="35%" cy="28%" r="80%">
              <stop offset="0%" stopColor="#2A2A2A" />
              <stop offset="60%" stopColor="#1A1A1A" />
              <stop offset="100%" stopColor="#101010" />
            </radialGradient>
          </defs>

          <path d={arc(cx, cy, radius, START_ANGLE, END_ANGLE)} fill="none" stroke="#2C2C2C" strokeWidth="4" strokeLinecap="round" />
          <path
            d={arc(cx, cy, radius, angle >= zeroAngle ? zeroAngle : angle, angle >= zeroAngle ? angle : zeroAngle)}
            fill="none"
            stroke={`url(#knob-${gradientId})`}
            strokeWidth="4"
            strokeLinecap="round"
            style={{ filter: 'drop-shadow(0 0 6px rgba(255,106,0,0.45))' }}
          />
          <circle cx={cx} cy={cy} r="23" fill={`url(#face-${gradientId})`} stroke="rgba(255,255,255,0.09)" strokeWidth="1" />
          <circle cx={cx} cy={cy} r="23" fill="none" stroke="rgba(0,0,0,0.6)" strokeWidth="6" opacity="0.25" />
          {(() => {
            const tickStart = polar(cx, cy, 9, angle)
            const tickEnd = polar(cx, cy, 19, angle)
            return (
              <line
                x1={tickStart.x}
                y1={tickStart.y}
                x2={tickEnd.x}
                y2={tickEnd.y}
                stroke="#FF8A3D"
                strokeWidth="2.6"
                strokeLinecap="round"
              />
            )
          })()}
          <circle cx={cx} cy={cy} r="2" fill="#FFB067" opacity="0.8" />
        </svg>
      </div>
      <div className="text-center leading-tight">
        <div className="num text-[11px] font-medium text-neutral-200">
          {display}
          <span className="ml-0.5 text-[9px] text-neutral-500">{unit}</span>
        </div>
        <div className="mt-0.5 text-[9.5px] font-semibold uppercase tracking-[0.13em] text-neutral-500 transition-colors group-hover:text-neutral-400">
          {label}
        </div>
      </div>
    </div>
  )
}

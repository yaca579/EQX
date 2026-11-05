import {
  AudioWaveform,
  CassetteTape,
  Disc3,
  Mic,
  Moon,
  Orbit,
  Rabbit,
  Radio,
  Snail,
  Sparkles,
  Trash2,
  Wind,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import type { CSSProperties } from 'react'
import { useStudio } from '../context/StudioContext'
import {
  EFFECT_META,
  EFFECT_ORDER,
  tempoMultiplier,
  type EffectId,
} from '../lib/studio'
import { Toggle } from './Toggle'

const ICONS: Record<EffectId, LucideIcon> = {
  bassBoost: AudioWaveform,
  superBass: Radio,
  vocalBoost: Mic,
  reverb: Wind,
  slowReverb: Moon,
  slowed: Snail,
  speedUp: Rabbit,
  eightD: Orbit,
  lofi: CassetteTape,
  vinyl: Disc3,
  distortion: Zap,
}

export function EffectsPanel({ className = '' }: { className?: string }) {
  const { state, toggleEffect, setEffectAmount, activeCount } = useStudio()
  const tempo = tempoMultiplier(state.effects)

  const clearAll = () => {
    EFFECT_ORDER.forEach((id) => {
      if (state.effects[id].enabled) toggleEffect(id)
    })
  }

  return (
    <aside className={`panel flex flex-col overflow-hidden ${className}`}>
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-brand" />
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-200">
            Efectos
          </h2>
          <span className="num rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-[9.5px] text-neutral-400">
            {activeCount}
          </span>
        </div>
        <button
          onClick={clearAll}
          disabled={activeCount === 0}
          className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[10.5px] text-neutral-500 transition hover:text-neutral-200 disabled:opacity-40"
        >
          <Trash2 size={11} /> Limpiar
        </button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {EFFECT_ORDER.map((id) => {
          const meta = EFFECT_META[id]
          const effect = state.effects[id]
          const Icon = ICONS[id]
          const enabled = effect.enabled

          return (
            <div
              key={id}
              className={`group rounded-xl border p-2.5 transition-all duration-200 ${
                enabled
                  ? 'border-brand/35 bg-gradient-to-b from-brand/[0.10] to-brand/[0.025] shadow-[inset_0_1px_0_rgba(255,138,61,0.18),0_0_24px_-16px_rgba(255,106,0,0.9)]'
                  : 'border-white/[0.06] bg-white/[0.015] hover:border-white/12'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition ${
                    enabled
                      ? 'border-brand/40 bg-brand/15 text-brand-soft'
                      : 'border-white/8 bg-white/[0.03] text-neutral-500'
                  }`}
                >
                  <Icon size={14} strokeWidth={1.9} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className={`truncate text-[12.5px] font-semibold ${enabled ? 'text-white' : 'text-neutral-300'}`}>
                        {meta.label}
                      </p>
                      <p className="text-[9.5px] font-medium uppercase tracking-[0.12em] text-neutral-600">
                        {meta.tag}
                      </p>
                    </div>
                    <Toggle
                      checked={enabled}
                      onChange={() => toggleEffect(id)}
                      label={`Activar ${meta.label}`}
                    />
                  </div>

                  <p className={`mt-1 text-[10.5px] leading-relaxed transition-colors ${enabled ? 'text-neutral-400' : 'text-neutral-500/80'}`}>
                    {meta.description}
                  </p>

                  {enabled && meta.hasAmount && (
                    <div className="mt-2">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-[9.5px] uppercase tracking-[0.1em] text-neutral-500">
                          {meta.amountLabel}
                        </span>
                        <span className="num text-[10px] text-brand-soft">
                          {Math.round(effect.amount * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={effect.amount}
                        onChange={(event) => setEffectAmount(id, Number(event.target.value))}
                        className="range"
                        style={{ '--fill': `${effect.amount * 100}%` } as CSSProperties}
                        aria-label={`${meta.label} intensidad`}
                      />
                    </div>
                  )}

                  {enabled && !meta.hasAmount && id !== 'slowReverb' && (
                    <p className="num mt-1.5 text-[10px] text-brand-soft/80">
                      Tempo ×{(id === 'speedUp' ? 1.22 : 0.85).toFixed(2)}
                    </p>
                  )}

                  {enabled && id === 'slowReverb' && (
                    <p className="num mt-1.5 text-[10px] text-brand-soft/80">Tempo ×0.84 · Reverb largo</p>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        <div className="rounded-xl border border-white/[0.06] bg-black/25 p-2.5">
          <div className="flex items-center justify-between text-[10px]">
            <span className="uppercase tracking-[0.12em] text-neutral-600">Tempo efectivo</span>
            <span className="num text-neutral-300">{tempo.toFixed(2)}×</span>
          </div>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#C24E00] to-[#FF8A3D] transition-[width] duration-300"
              style={{ width: `${Math.min(100, (tempo / 1.5) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </aside>
  )
}

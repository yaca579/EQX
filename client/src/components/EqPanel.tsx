import { RotateCcw, Sliders, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useStudio } from '../context/StudioContext'
import {
  formatDb,
  EQ_BAND_LABELS,
  EQ_BAND_TYPE_META,
  EQ_FREQUENCIES,
  EQ_SLOPES,
  isCutType,
} from '../lib/studio'
import { EqCanvas } from './EqCanvas'

export function EqPanel({ className = '' }: { className?: string }) {
  const { state, setBand, setBandType, setBandSlope, resetEq } = useStudio()
  const [selected, setSelected] = useState(5)

  const type = state.bandTypes[selected] ?? 'bell'
  const cut = isCutType(type)
  const typeLabel = EQ_BAND_TYPE_META.find((meta) => meta.id === type)?.label ?? 'Campana'
  const slope = state.bandSlopes[selected] ?? 24

  return (
    <section className={`panel overflow-hidden ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-2">
          <Sliders size={14} className="text-brand" />
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-200">
            Ecualizador gráfico
          </h2>
          <span className="rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-[9.5px] text-neutral-400">
            10 bandas
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1.5 text-[10px] text-neutral-500 sm:flex">
            <Sparkles size={11} /> Arrastra los puntos · doble clic para resetear
          </span>
          <button
            onClick={resetEq}
            className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[10.5px] text-neutral-500 transition hover:text-neutral-200"
          >
            <RotateCcw size={11} /> EQ plano
          </button>
        </div>
      </div>

      <div className="px-2.5 pb-1 pt-2.5 sm:px-3">
        <EqCanvas
          bands={state.bands}
          types={state.bandTypes}
          slopes={state.bandSlopes}
          selected={selected}
          onChange={setBand}
          onSelect={setSelected}
          height={286}
        />
      </div>

      <div className="mx-2.5 mb-2 rounded-xl border border-white/[0.07] bg-black/30 px-2.5 py-2 sm:mx-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <div className="flex items-center gap-1.5">
            <span className="label-xs">Banda</span>
            <span className="num text-[11px] font-semibold text-white">{EQ_BAND_LABELS[selected]} Hz</span>
            <span className="text-[10px] text-neutral-500">{typeLabel}</span>
          </div>

          <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Tipo de filtro">
            {EQ_BAND_TYPE_META.map((meta) => {
              const active = meta.id === type
              return (
                <button
                  key={meta.id}
                  type="button"
                  onClick={() => setBandType(selected, meta.id)}
                  aria-pressed={active}
                  title={meta.label}
                  className={`rounded-md border px-1.5 py-1 text-[10px] transition ${
                    active
                      ? 'border-brand/50 bg-brand/15 text-brand'
                      : 'border-white/10 bg-white/[0.02] text-neutral-400 hover:border-white/20 hover:text-neutral-200'
                  }`}
                >
                  {meta.short}
                </button>
              )
            })}
          </div>

          <div className={`flex items-center gap-1 transition ${cut ? '' : 'opacity-45'}`}>
            <span className="label-xs">dB/oct</span>
            {EQ_SLOPES.map((option) => {
              const active = cut && slope === option
              return (
                <button
                  key={option}
                  type="button"
                  disabled={!cut}
                  onClick={() => setBandSlope(selected, option)}
                  aria-pressed={active}
                  className={`num rounded-md border px-1.5 py-1 text-[10px] transition ${
                    active
                      ? 'border-brand/50 bg-brand/15 text-brand'
                      : 'border-white/10 bg-white/[0.02] text-neutral-400 hover:border-white/20 hover:text-neutral-200'
                  }`}
                >
                  {option}
                </button>
              )
            })}
          </div>

          <p className="w-full text-[10px] leading-relaxed text-neutral-600 sm:w-auto">
            {cut
              ? 'Low cut recorta los graves por la izquierda; high cut los agudos por la derecha.'
              : 'Campana para subir o bajar una zona concreta del espectro.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-1 px-2 pb-3 pt-1 sm:px-3">
        {EQ_FREQUENCIES.map((frequency, index) => (
          <div key={frequency} className="text-center">
            <p className="num text-[10.5px] text-neutral-400">{formatDb(state.bands[index] ?? 0)}</p>
            <p className="label-xs mt-0.5 text-[8.5px] tracking-[0.08em] text-neutral-600">
              {EQ_BAND_LABELS[index]}
            </p>
          </div>
        ))}
      </div>

    </section>
  )
}

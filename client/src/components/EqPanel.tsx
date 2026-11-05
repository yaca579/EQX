import { RotateCcw, Sliders, Sparkles } from 'lucide-react'
import { useStudio } from '../context/StudioContext'
import { formatBalance, formatDb, EQ_FREQUENCIES, EQ_BAND_LABELS } from '../lib/studio'
import { EqCanvas } from './EqCanvas'
import { Knob } from './Knob'

export function EqPanel({ className = '' }: { className?: string }) {
  const { state, setTone, setBand, setGain, setBalance } = useStudio()

  const resetEq = () => {
    EQ_FREQUENCIES.forEach((_, index) => setBand(index, 0))
  }

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
        <EqCanvas bands={state.bands} onChange={setBand} height={286} />
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

      <div className="hairline mx-4" />

      <div className="px-3 py-4 sm:px-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="label-xs">Tono y salida</p>
          <p className="text-[10px] text-neutral-600">Estantes suaves · ganancia de salida</p>
        </div>
        <div className="grid grid-cols-5 gap-1 sm:gap-3">
          <Knob label="Bass" value={state.bass} onChange={(value) => setTone('bass', value)} />
          <Knob label="Mid" value={state.mid} onChange={(value) => setTone('mid', value)} />
          <Knob label="Treble" value={state.treble} onChange={(value) => setTone('treble', value)} />
          <Knob label="Gain" value={state.gain} onChange={setGain} />
          <Knob
            label="Balance"
            value={state.balance}
            min={-1}
            max={1}
            step={0.05}
            defaultValue={0}
            unit=""
            bipolar
            onChange={setBalance}
            formatValue={formatBalance}
          />
        </div>
      </div>
    </section>
  )
}

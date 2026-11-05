import { Fragment } from 'react'
import { ArrowRight, Music2, SlidersHorizontal } from 'lucide-react'
import { usePlayer } from '../context/PlayerContext'
import { useStudio } from '../context/StudioContext'
import { EFFECT_META } from '../lib/studio'

/**
 * Tira inferior con la cadena de señal: fuente → EQ → efectos activos → salida.
 * Cada efecto activo se puede apagar desde aquí.
 */
export function SignalChain({ className = '' }: { className?: string }) {
  const { current } = usePlayer()
  const { state, activeList, toggleEffect } = useStudio()

  const eqActive =
    state.bands.some((band) => Math.abs(band) > 0.4) ||
    Math.abs(state.bass) > 0.4 ||
    Math.abs(state.mid) > 0.4 ||
    Math.abs(state.treble) > 0.4

  return (
    <div
      className={`panel-metal flex items-center gap-1.5 overflow-x-auto px-3 py-2.5 no-scrollbar ${className}`}
    >
      <span className="label-xs mr-1 shrink-0">Cadena</span>

      <span
        className={`chain-node shrink-0 ${current ? 'chain-node-on' : ''}`}
        title={current ? `${current.title} · ${current.artist}` : 'Sin fuente'}
      >
        <Music2 size={11} />
        {current ? 'IN' : 'IN'}
      </span>

      <span className="chain-link" aria-hidden />

      <span className={`chain-node shrink-0 ${eqActive ? 'chain-node-on' : ''}`}>
        <SlidersHorizontal size={11} />
        EQ
      </span>

      {activeList.map((id) => (
        <Fragment key={id}>
          <span className="chain-link" aria-hidden />
          <button
            type="button"
            onClick={() => toggleEffect(id)}
            className="chain-node chain-node-on shrink-0"
            title={`Desactivar ${EFFECT_META[id].label}`}
          >
            {EFFECT_META[id].label}
          </button>
        </Fragment>
      ))}

      <span className="chain-link" aria-hidden />
      <span className="chain-node chain-node-on shrink-0">
        <ArrowRight size={11} />
        OUT
      </span>

      {activeList.length === 0 && (
        <span className="ml-2 shrink-0 text-[9.5px] uppercase tracking-[0.12em] text-neutral-600">
          Sin efectos activos
        </span>
      )}
    </div>
  )
}

import { Compass, Music2, Radio } from 'lucide-react'
import { Link } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext'
import { useStudio } from '../context/StudioContext'
import { formatBalance } from '../lib/studio'
import { Cover } from './Cover'
import { Knob } from './Knob'
import { SpectrumCanvas } from './SpectrumCanvas'

function Screw({ className = '' }: { className?: string }) {
  return <span aria-hidden className={`screw ${className}`} />
}

function Rocker({
  on,
  label,
  onClick,
  disabled,
  title,
}: {
  on: boolean
  label: string
  onClick: () => void
  disabled?: boolean
  title: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={on}
      className="group/rocker flex flex-col items-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="flex h-9 w-7 items-center justify-center rounded-[5px] border border-[#7a5c31]/70 bg-gradient-to-b from-[#241d14] to-[#120d08] shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_2px_5px_rgba(0,0,0,0.45)]">
        <span
          className={`h-4 w-3.5 rounded-[2px] transition-all duration-200 ${
            on
              ? 'bg-gradient-to-b from-[#FF8A3D] to-[#C24E00] shadow-[0_0_10px_rgba(255,106,0,0.85)]'
              : 'bg-gradient-to-b from-[#3b3024] to-[#241b12] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
          }`}
        />
      </span>
      <span
        className={`text-[8px] font-bold uppercase tracking-[0.16em] transition-colors ${
          on ? 'text-[#3a2a16]' : 'text-[#74603f]'
        }`}
      >
        {label}
      </span>
    </button>
  )
}

/**
 * Consola principal del estudio: la "cabeza" del amplificador.
 * Rejilla con el analizador, panel de control con knobs reales y display de pista.
 */
export function AmpConsole({ className = '' }: { className?: string }) {
  const { current, isPlaying, toggle, volume, setVolume } = usePlayer()
  const { state, setTone, setGain, setBalance, presetLabel, tempo, activeCount } = useStudio()
  const muted = volume === 0

  return (
    <section className={`console-shell relative overflow-hidden ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-2 sm:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${
              isPlaying ? 'animate-pulse bg-brand shadow-[0_0_8px_rgba(255,106,0,0.9)]' : 'bg-neutral-700'
            }`}
          />
          <p className="label-xs shrink-0">{isPlaying ? 'Señal activa' : current ? 'En pausa' : 'Sin señal'}</p>
          <span className="hidden text-[10px] text-neutral-700 sm:inline">·</span>
          <p className="hidden truncate text-[11px] text-neutral-500 sm:block">{presetLabel}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="chip text-[10px]">
            <Radio size={10} className="text-brand/80" /> {activeCount} efectos
          </span>
          <span className="chip text-[10px]">Tempo {tempo.toFixed(2)}×</span>
        </div>
      </div>

      <div className="amp-grille relative px-3 pb-1 pt-3 sm:px-5 sm:pt-4">
        <div className="flex items-end justify-between gap-4 px-1">
          <p className="font-serif text-[26px] italic leading-none tracking-[0.04em] text-neutral-200/85 sm:text-[32px]">
            EQX
          </p>
          <p className="num text-[7.5px] uppercase tracking-[0.3em] text-neutral-500 sm:text-[8.5px]">
            Studio Series · 10 Band
          </p>
        </div>
        <SpectrumCanvas
          height={104}
          className="mt-1"
          idleLabel={current ? 'Pulsa play' : 'Sin pista'}
        />
      </div>

      <div className="amp-faceplate relative px-3 pb-4 pt-4 sm:px-6 sm:pb-5">
        <Screw className="left-2 top-2" />
        <Screw className="right-2 top-2" />
        <Screw className="bottom-2 left-2" />
        <Screw className="bottom-2 right-2" />

        <div className="grid grid-cols-3 gap-x-1 gap-y-4 sm:grid-cols-6 sm:gap-x-2">
          <Knob
            variant="panel"
            size={58}
            label="Bass"
            value={state.bass}
            onChange={(value) => setTone('bass', value)}
          />
          <Knob
            variant="panel"
            size={58}
            label="Middle"
            value={state.mid}
            onChange={(value) => setTone('mid', value)}
          />
          <Knob
            variant="panel"
            size={58}
            label="Treble"
            value={state.treble}
            onChange={(value) => setTone('treble', value)}
          />
          <Knob variant="panel" size={58} label="Pre Amp" value={state.gain} onChange={setGain} />
          <Knob
            variant="panel"
            size={58}
            label="Balance"
            value={state.balance}
            min={-1}
            max={1}
            step={0.05}
            defaultValue={0}
            unit=""
            formatValue={formatBalance}
            onChange={setBalance}
          />
          <Knob
            variant="panel"
            size={58}
            label="Master"
            value={volume}
            min={0}
            max={1}
            step={0.01}
            defaultValue={0.85}
            unit=""
            bipolar={false}
            formatValue={(value) => `${Math.round(value * 100)}`}
            onChange={setVolume}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-4">
            <Rocker
              on={isPlaying}
              label="Power"
              onClick={toggle}
              disabled={!current}
              title={isPlaying ? 'Pausar reproducción' : 'Reproducir'}
            />
            <Rocker
              on={!muted}
              label="Signal"
              onClick={() => setVolume(muted ? 0.85 : 0)}
              title={muted ? 'Activar sonido' : 'Silenciar'}
            />
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-end gap-2.5">
            <div className="flex min-w-0 max-w-[320px] items-center gap-2.5 rounded-md border border-black/40 bg-[#0c0a07] px-2.5 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),inset_0_0_24px_rgba(0,0,0,0.8)]">
              {current ? (
                <Cover track={current} className="h-8 w-8 shrink-0" rounded="rounded" />
              ) : (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-[#3a2f1e] text-[#6b5940]">
                  <Music2 size={13} />
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-[11.5px] font-semibold text-[#f2e6cf]">
                  {current?.title ?? 'Ninguna pista cargada'}
                </p>
                <p className="truncate text-[9.5px] text-[#8a7a62]">
                  {current ? `${current.artist}${current.album ? ` · ${current.album}` : ''}` : 'Elige una canción para empezar'}
                </p>
              </div>
            </div>
            {!current && (
              <Link to="/explore" className="chip chip-active shrink-0 text-[10px]">
                <Compass size={10} /> Explorar
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

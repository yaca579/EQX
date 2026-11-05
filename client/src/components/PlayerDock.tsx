import { Heart, ListMusic, Pause, Play, SkipBack, SkipForward, Volume1, Volume2, VolumeX, Gauge } from 'lucide-react'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Cover } from './Cover'
import { useLibrary } from '../context/LibraryContext'
import { usePlayer } from '../context/PlayerContext'
import { useStudio } from '../context/StudioContext'
import { formatTime } from '../lib/format'
import { SPEED_OPTIONS } from '../lib/studio'

export function PlayerDock() {
  const {
    current,
    isPlaying,
    isLoading,
    toggle,
    next,
    previous,
    time,
    duration,
    seek,
    volume,
    setVolume,
    queue,
  } = usePlayer()
  const { isFavorite, toggleFavorite } = useLibrary()
  const { state, setSpeed, tempo } = useStudio()

  const barRef = useRef<HTMLDivElement | null>(null)
  const [scrubbing, setScrubbing] = useState<number | null>(null)
  const [speedOpen, setSpeedOpen] = useState(false)
  const speedRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!speedOpen) return
    const onClick = (event: MouseEvent) => {
      if (!speedRef.current?.contains(event.target as Node)) setSpeedOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [speedOpen])

  if (!current) return null

  const total = duration || current.duration || 0
  const displayed = scrubbing ?? time
  const progress = total > 0 ? Math.min(1, displayed / total) : 0
  const favorite = isFavorite(current.id)
  const speedLabel = state.speed === 1 ? '1×' : `${state.speed}×`

  const seekFrom = (clientX: number) => {
    const element = barRef.current
    if (!element || total <= 0) return
    const rect = element.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    setScrubbing(ratio * total)
    seek(ratio * total)
  }

  return (
    <footer className="fixed inset-x-0 bottom-[64px] z-50 lg:bottom-0">
      <div className="border-t border-white/[0.08] bg-[#0c0c0c]/94 shadow-[0_-20px_50px_-30px_rgba(0,0,0,0.95)] backdrop-blur-xl">
        <div className="mx-auto grid max-w-[1900px] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-3 pb-2.5 pt-2.5 sm:px-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.35fr)_minmax(0,0.9fr)] lg:gap-6 lg:py-3">
          {/* Pista actual */}
          <div className="flex min-w-0 items-center gap-3">
            <Cover track={current} className="h-11 w-11 shrink-0 lg:h-12 lg:w-12" rounded="rounded-lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-white">{current.title}</p>
              <p className="truncate text-[11px] text-neutral-500">
                {current.artist}
                {current.album ? ` · ${current.album}` : ''}
              </p>
            </div>
            <button
              onClick={() => void toggleFavorite(current)}
              className={`icon-btn shrink-0 ${favorite ? 'text-brand' : ''}`}
              aria-label={favorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
            >
              <Heart size={16} fill={favorite ? 'currentColor' : 'none'} />
            </button>
            <button onClick={toggle} className="icon-btn shrink-0 lg:hidden" aria-label={isPlaying ? 'Pausar' : 'Reproducir'}>
              {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
            </button>
          </div>

          {/* Transporte + progreso */}
          <div className="col-span-2 w-full lg:col-span-1">
            <div className="flex items-center justify-center gap-3">
              <button onClick={previous} className="icon-btn hidden sm:inline-flex" aria-label="Canción anterior">
                <SkipBack size={16} fill="currentColor" />
              </button>
              <button
                onClick={toggle}
                className="relative hidden h-11 w-11 items-center justify-center rounded-full bg-gradient-to-b from-[#FF8A3D] to-[#F25F00] text-[#170d05] shadow-[0_10px_26px_-12px_rgba(255,106,0,0.95)] transition hover:brightness-110 active:scale-[0.97] sm:flex"
                aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
              >
                {isLoading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#170d05]/40 border-t-[#170d05]" />
                ) : isPlaying ? (
                  <Pause size={17} fill="currentColor" />
                ) : (
                  <Play size={17} fill="currentColor" className="ml-0.5" />
                )}
              </button>
              <button onClick={next} className="icon-btn hidden sm:inline-flex" aria-label="Siguiente canción">
                <SkipForward size={16} fill="currentColor" />
              </button>
            </div>

            <div className="mt-1.5 flex items-center gap-2.5">
              <span className="num w-9 shrink-0 text-right text-[10px] text-neutral-500">{formatTime(displayed)}</span>
              <div
                ref={barRef}
                role="slider"
                aria-label="Progreso de la canción"
                aria-valuemin={0}
                aria-valuemax={Math.round(total)}
                aria-valuenow={Math.round(displayed)}
                tabIndex={0}
                onPointerDown={(event) => {
                  event.currentTarget.setPointerCapture(event.pointerId)
                  seekFrom(event.clientX)
                }}
                onPointerMove={(event) => {
                  if (event.currentTarget.hasPointerCapture(event.pointerId)) seekFrom(event.clientX)
                }}
                onPointerUp={(event) => {
                  if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                    event.currentTarget.releasePointerCapture(event.pointerId)
                  }
                  setScrubbing(null)
                }}
                onPointerCancel={() => setScrubbing(null)}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowRight') seek(time + 5)
                  if (event.key === 'ArrowLeft') seek(time - 5)
                }}
                className="group/bar relative flex h-4 flex-1 cursor-pointer touch-none items-center"
              >
                <div className="relative h-[3px] w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#C24E00] to-[#FF8A3D] transition-[width] duration-200 ease-linear"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
                <span
                  className="absolute h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-white opacity-0 shadow-[0_0_10px_rgba(255,106,0,0.9)] transition-opacity group-hover/bar:opacity-100"
                  style={{ left: `${progress * 100}%`, opacity: scrubbing !== null ? 1 : undefined }}
                />
              </div>
              <span className="num w-9 shrink-0 text-[10px] text-neutral-500">{formatTime(total)}</span>
            </div>
          </div>

          {/* Velocidad + volumen */}
          <div className="col-span-2 flex items-center justify-between gap-3 lg:col-span-1 lg:justify-end">
            <div className="flex items-center gap-2 text-[11px] text-neutral-500">
              <ListMusic size={13} />
              <span className="num">{queue.length || 1}</span>
            </div>

            <div className="relative" ref={speedRef}>
              <button
                onClick={() => setSpeedOpen((value) => !value)}
                className={`btn h-8 gap-1.5 px-2.5 py-1 text-[11.5px] ${
                  state.speed !== 1 ? 'border-brand/40 bg-brand/10 text-brand-soft' : 'btn-ghost'
                }`}
                aria-haspopup="listbox"
                aria-expanded={speedOpen}
              >
                <Gauge size={14} />
                {speedLabel}
              </button>
              {speedOpen && (
                <div
                  role="listbox"
                  aria-label="Velocidad de reproducción"
                  className="absolute bottom-11 right-0 z-50 w-32 animate-[rise_0.18s_ease-out] overflow-hidden rounded-xl border border-white/10 bg-[#171717] p-1 shadow-[0_24px_50px_-20px_rgba(0,0,0,0.9)]"
                >
                  <p className="label-xs px-2 py-1.5">Velocidad</p>
                  {SPEED_OPTIONS.map((option) => (
                    <button
                      key={option}
                      role="option"
                      aria-selected={state.speed === option}
                      onClick={() => {
                        setSpeed(option)
                        setSpeedOpen(false)
                      }}
                      className={`num flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-[12px] transition ${
                        state.speed === option
                          ? 'bg-brand/15 text-brand-soft'
                          : 'text-neutral-300 hover:bg-white/5'
                      }`}
                    >
                      {option}×
                      {state.speed === option && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
                    </button>
                  ))}
                  {Math.abs(tempo - state.speed) > 0.001 && (
                    <p className="num mt-1 border-t border-white/8 px-2 py-1.5 text-[10px] text-neutral-500">
                      Efectivo {tempo.toFixed(2)}×
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setVolume(volume > 0 ? 0 : 0.85)}
                className="icon-btn"
                aria-label={volume > 0 ? 'Silenciar' : 'Activar sonido'}
              >
                {volume === 0 ? <VolumeX size={16} /> : volume < 0.5 ? <Volume1 size={16} /> : <Volume2 size={16} />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(event) => setVolume(Number(event.target.value))}
                className="range hidden w-24 sm:block"
                style={{ '--fill': `${volume * 100}%` } as CSSProperties}
                aria-label="Volumen"
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

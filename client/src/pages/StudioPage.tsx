import {
  Compass,
  Headphones,
  Library as LibraryIcon,
  Music2,
  Radio,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Cover } from '../components/Cover'
import { EffectsPanel } from '../components/EffectsPanel'
import { EqPanel } from '../components/EqPanel'
import { LibraryPanel } from '../components/LibraryPanel'
import { PresetBar } from '../components/PresetBar'
import { SpectrumCanvas } from '../components/SpectrumCanvas'
import { usePlayer } from '../context/PlayerContext'
import { useStudio } from '../context/StudioContext'
import { useToast } from '../context/ToastContext'
import { decodePreset } from '../lib/share'
import { EFFECT_META } from '../lib/studio'

type MobileTab = 'library' | 'editor' | 'effects'

const MOBILE_TABS: Array<{ id: MobileTab; label: string; icon: typeof LibraryIcon }> = [
  { id: 'library', label: 'Biblioteca', icon: LibraryIcon },
  { id: 'editor', label: 'Editor', icon: SlidersHorizontal },
  { id: 'effects', label: 'Efectos', icon: Sparkles },
]

export function StudioPage() {
  const { current, isPlaying, queue } = usePlayer()
  const { state, presetLabel, activeList, activeCount, tempo, applyState } = useStudio()
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const [mobileTab, setMobileTab] = useState<MobileTab>('editor')
  const imported = useRef(false)

  useEffect(() => {
    const payload = searchParams.get('preset')
    if (!payload || imported.current) return
    imported.current = true
    const decoded = decodePreset(payload)
    if (decoded) {
      applyState(decoded, 'Preset compartido')
      toast('Preset importado desde el enlace')
    } else {
      toast('El enlace del preset no es válido.', 'error')
    }
    const next = new URLSearchParams(searchParams)
    next.delete('preset')
    setSearchParams(next, { replace: true })
  }, [applyState, searchParams, setSearchParams, toast])

  return (
    <div className="space-y-3">
      <PresetBar />

      <div className="flex items-center justify-between gap-2 xl:hidden">
        <div className="panel-flat flex flex-1 gap-1 p-1">
          {MOBILE_TABS.map((tab) => {
            const Icon = tab.icon
            const active = mobileTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setMobileTab(tab.id)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11.5px] font-medium transition ${
                  active ? 'bg-brand/15 text-brand-soft' : 'text-neutral-500'
                }`}
              >
                <Icon size={13} /> {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[264px_minmax(0,1fr)_330px]">
        <LibraryPanel
          className={`${mobileTab === 'library' ? 'flex' : 'hidden'} min-w-0 h-[68vh] xl:sticky xl:top-[72px] xl:flex xl:h-[calc(100dvh-190px)]`}
        />

        <div className={`${mobileTab === 'editor' ? 'block' : 'hidden'} min-w-0 space-y-3 xl:block`}>
          <section className="panel relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 grid-lines opacity-25" />
            <div className="pointer-events-none absolute -left-10 -top-24 h-56 w-56 rounded-full bg-brand/[0.14] blur-[80px]" />

            <div className="relative flex flex-wrap items-center justify-between gap-3 px-4 pt-3.5">
              <div className="flex min-w-0 items-center gap-3">
                {current ? (
                  <Cover track={current} className="h-12 w-12 shrink-0" />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-neutral-600">
                    <Music2 size={18} />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="label-xs flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${isPlaying ? 'animate-pulse bg-brand' : 'bg-neutral-600'}`} />
                    {isPlaying ? 'En reproducción' : current ? 'Pausado' : 'Sin pista'}
                  </p>
                  <p className="mt-0.5 truncate text-[13.5px] font-semibold text-white">
                    {current?.title ?? 'Elige una canción de la biblioteca'}
                  </p>
                  <p className="truncate text-[10.5px] text-neutral-500">
                    {current ? `${current.artist}${current.album ? ` · ${current.album}` : ''}` : 'El analizador se activa al reproducir'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="chip text-[10px]">
                  <Radio size={10} className="text-brand/80" /> {activeCount} efectos
                </span>
                <span className="chip text-[10px]">Tempo {tempo.toFixed(2)}×</span>
                {!current && (
                  <Link to="/explore" className="chip chip-active text-[10px]">
                    <Compass size={10} /> Explorar
                  </Link>
                )}
              </div>
            </div>

            <SpectrumCanvas height={138} className="mt-1 px-1" idleLabel={current ? 'Pulsa play' : 'Sin pista'} />

            <div className="flex items-center justify-between gap-2 border-t border-white/[0.05] px-4 py-2">
              <div className="flex flex-1 gap-1 overflow-x-auto no-scrollbar">
                {activeList.length === 0 ? (
                  <span className="text-[10px] text-neutral-600">Sin efectos activos</span>
                ) : (
                  activeList.map((id) => (
                    <span key={id} className="chip chip-active shrink-0 text-[9.5px]">
                      {EFFECT_META[id].label}
                    </span>
                  ))
                )}
              </div>
              <span className="num shrink-0 text-[9px] uppercase tracking-[0.1em] text-neutral-600">
                FFT 4096 · {presetLabel}
              </span>
            </div>
          </section>

          <EqPanel />
        </div>

        <EffectsPanel
          className={`${mobileTab === 'effects' ? 'flex' : 'hidden'} min-w-0 max-h-[68vh] xl:sticky xl:top-[72px] xl:flex xl:max-h-[calc(100dvh-190px)]`}
        />

        {!current && (
          <section className="panel-flat col-span-full flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <Headphones size={15} className="text-brand/80" />
              <p className="text-[11.5px] text-neutral-400">
                Tips: prueba <span className="text-neutral-200">Bass Boost</span> con{' '}
                <span className="text-neutral-200">Super Bass</span>, o activa{' '}
                <span className="text-neutral-200">8D Audio</span> con auriculares.
              </p>
            </div>
            <span className="num text-[9.5px] uppercase tracking-[0.12em] text-neutral-600">
              {state.bands.filter((band) => Math.abs(band) > 0.4).length} bandas activas
            </span>
          </section>
        )}
      </div>
    </div>
  )
}

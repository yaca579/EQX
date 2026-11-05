import {
  ArrowRight,
  Compass,
  Disc3,
  Heart,
  Layers,
  Play,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Waves,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Cover } from '../components/Cover'
import { PresetMiniEq } from '../components/PresetMiniEq'
import { TrackCard } from '../components/TrackCard'
import { useAuth } from '../context/AuthContext'
import { useLibrary } from '../context/LibraryContext'
import { usePlayer } from '../context/PlayerContext'
import { usePresets } from '../context/PresetsContext'
import { useStudio } from '../context/StudioContext'
import { useToast } from '../context/ToastContext'
import type { Track } from '../lib/types'
import { fetchTrending } from '../services/musicApi'

export function DashboardPage() {
  const { user } = useAuth()
  const { favorites } = useLibrary()
  const { presets, factoryPresets } = usePresets()
  const { activeCount, tempo, applyPreset } = useStudio()
  const { current, recent, playTrack, isPlaying } = usePlayer()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [trending, setTrending] = useState<Track[]>([])
  const [demoMode, setDemoMode] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    fetchTrending(10, controller.signal)
      .then((result) => {
        setTrending(result.tracks)
        setDemoMode(result.demoMode)
      })
      .catch((error: unknown) => {
        if ((error as Error)?.name !== 'AbortError') setTrending([])
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [])

  const favorite = favorites.length
  const savedPresets = presets.length
  const hasTrack = Boolean(current)
  const highlightedPresets = factoryPresets.slice(0, 4)

  const loadPreset = (presetId: string) => {
    const preset = highlightedPresets.find((item) => item.id === presetId)
    if (!preset) return
    applyPreset(preset)
    toast(`Preset “${preset.name}” listo en el studio`)
    navigate('/studio')
  }

  return (
    <div className="space-y-4">
      <section className="panel relative overflow-hidden p-5 sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-24 h-[320px] w-[320px] rounded-full bg-brand/[0.16] blur-[100px]" />
        <div className="pointer-events-none absolute inset-0 grid-lines opacity-30" />

        <div className="relative grid gap-6 lg:grid-cols-[1.45fr_1fr] lg:items-center">
          <div>
            <p className="label-xs flex items-center gap-1.5 text-brand">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
              Estudio en tiempo real
            </p>
            <h1 className="mt-2.5 text-balance text-[26px] font-semibold leading-[1.1] tracking-[-0.02em] text-white sm:text-[34px]">
              Hola{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}. Tu mezcla empieza aquí.
            </h1>
            <p className="mt-2.5 max-w-lg text-[12.5px] leading-relaxed text-neutral-400 sm:text-[13.5px]">
              Elige una canción, mueve el ecualizador y combina efectos sin exportar nada. Todo suena
              al instante, igual que en un plugin profesional.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Link to="/studio" className="btn btn-primary">
                <SlidersHorizontal size={14} /> Abrir studio
              </Link>
              <Link to="/explore" className="btn btn-ghost">
                <Compass size={14} /> Explorar música
              </Link>
            </div>
          </div>

          <div className="panel-flat relative overflow-hidden p-4">
            <div className="flex items-center justify-between">
              <p className="label-xs">Sesión actual</p>
              <span className="num text-[9.5px] text-neutral-500">{tempo.toFixed(2)}× tempo</span>
            </div>

            {hasTrack && current ? (
              <div className="mt-3 flex items-center gap-3">
                <Cover track={current} className="h-14 w-14 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-white">{current.title}</p>
                  <p className="truncate text-[11px] text-neutral-500">{current.artist}</p>
                  <button
                    onClick={() => playTrack(current)}
                    className="mt-1.5 inline-flex items-center gap-1 text-[10.5px] font-semibold text-brand hover:text-brand-soft"
                  >
                    <Play size={10} fill="currentColor" /> {isPlaying ? 'Pausar' : 'Reanudar'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3 rounded-lg border border-dashed border-white/10 px-3 py-4 text-center">
                <Disc3 size={18} className="mx-auto text-neutral-600" />
                <p className="mt-1.5 text-[11px] text-neutral-500">Nada sonando todavía</p>
              </div>
            )}

            <div className="mt-3 flex items-center justify-between rounded-lg border border-white/8 bg-black/25 px-2.5 py-2">
              <span className="text-[10px] uppercase tracking-[0.12em] text-neutral-600">Efectos activos</span>
              <span className="num text-[12px] font-semibold text-brand">{activeCount}</span>
            </div>

            <div className="mt-2 flex gap-1.5 overflow-hidden">
              {recent.slice(0, 4).map((track) => (
                <button
                  key={track.id}
                  onClick={() => playTrack(track, recent)}
                  className="group"
                  title={track.title}
                >
                  <Cover track={track} className="h-9 w-9 transition group-hover:brightness-110" rounded="rounded-md" />
                </button>
              ))}
              {recent.length === 0 && <p className="text-[10px] text-neutral-600">Tu historial aparecerá aquí.</p>}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Favoritos', value: favorite, icon: Heart, hint: 'en tu cuenta' },
          { label: 'Presets guardados', value: savedPresets, icon: Layers, hint: 'configuraciones' },
          { label: 'Efectos activos', value: activeCount, icon: Sparkles, hint: 'en la cadena' },
          { label: 'Historial', value: recent.length, icon: Waves, hint: 'pistas recientes' },
        ].map((item) => {
          const Icon = item.icon
          return (
            <div key={item.label} className="panel flex items-center gap-3 px-3.5 py-3.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/8 bg-white/[0.03] text-brand/80">
                <Icon size={15} />
              </span>
              <div>
                <p className="num text-[18px] font-semibold leading-none text-white">{item.value}</p>
                <p className="mt-1 text-[10.5px] text-neutral-500">{item.label}</p>
              </div>
            </div>
          )
        })}
      </section>

      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-brand" />
            <h2 className="text-[12.5px] font-semibold uppercase tracking-[0.14em] text-neutral-200">
              {demoMode ? 'Catálogo demo' : 'Tendencias en Jamendo'}
            </h2>
          </div>
          <Link to="/explore" className="flex items-center gap-1 text-[11px] text-neutral-500 transition hover:text-brand">
            Ver todo <ArrowRight size={12} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="panel-flat overflow-hidden">
                <div className="skeleton aspect-square" />
                <div className="space-y-1.5 p-3">
                  <div className="skeleton h-2.5 w-3/4 rounded" />
                  <div className="skeleton h-2 w-1/2 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {trending.slice(0, 5).map((track) => (
              <TrackCard key={track.id} track={track} queue={trending} compact />
            ))}
          </div>
        )}

        {demoMode && (
          <p className="px-1 text-[10.5px] leading-relaxed text-neutral-600">
            Estás viendo pistas sintetizadas localmente. Añade <span className="num text-neutral-400">JAMENDO_CLIENT_ID</span> en
            el archivo <span className="num text-neutral-400">.env</span> para explorar el catálogo completo de Jamendo.
          </p>
        )}
      </section>

      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-brand" />
            <h2 className="text-[12.5px] font-semibold uppercase tracking-[0.14em] text-neutral-200">
              Cadenas listas para probar
            </h2>
          </div>
          <Link to="/presets" className="flex items-center gap-1 text-[11px] text-neutral-500 transition hover:text-brand">
            Todos los presets <ArrowRight size={12} />
          </Link>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          {highlightedPresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => loadPreset(preset.id)}
              className="panel group flex items-center gap-3 px-3.5 py-3 text-left transition hover:border-brand/30"
            >
              <PresetMiniEq bands={preset.state.bands} className="h-8 w-12 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12.5px] font-semibold text-neutral-100">{preset.name}</span>
                <span className="mt-0.5 block truncate text-[10.5px] text-neutral-500">{preset.description}</span>
              </span>
              <ArrowRight size={13} className="shrink-0 text-neutral-600 transition group-hover:text-brand" />
            </button>
          ))}
        </div>
      </section>

      {favorite === 0 && (
        <section className="panel-flat flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand/25 bg-brand/10 text-brand">
              <Heart size={15} />
            </span>
            <div>
              <p className="text-[12.5px] font-medium text-neutral-200">Guarda tus canciones favoritas</p>
              <p className="text-[11px] text-neutral-500">
                Pulsa el corazón en cualquier pista para tenerla siempre a mano.
              </p>
            </div>
          </div>
          <Link to="/explore" className="btn btn-ghost h-8 text-[11.5px]">
            Explorar catálogo <ArrowRight size={12} />
          </Link>
        </section>
      )}
    </div>
  )
}

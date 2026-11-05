import { Cloud, Compass, Loader2, Music2, Search, Sparkles, UploadCloud, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { TrackCard } from '../components/TrackCard'
import { TrackRow } from '../components/TrackRow'
import { UploadTracks } from '../components/UploadTracks'
import { useLocalTracks } from '../context/LocalTracksContext'
import { searchMusic } from '../services/musicApi'
import type { Track } from '../lib/types'

const GENRES = [
  { id: '', label: 'Todos' },
  { id: 'electronic', label: 'Electronic' },
  { id: 'synthwave', label: 'Synthwave' },
  { id: 'lofi', label: 'Lo-Fi' },
  { id: 'ambient', label: 'Ambient' },
  { id: 'hiphop', label: 'Hip-Hop' },
  { id: 'techno', label: 'Techno' },
  { id: 'chill', label: 'Chill' },
  { id: 'club', label: 'Club' },
]

const SOURCES = [
  { id: 'jamendo', label: 'Jamendo', available: true },
  { id: 'spotify', label: 'Spotify', available: false },
  { id: 'soundcloud', label: 'SoundCloud', available: false },
]

export function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') ?? ''

  const [query, setQuery] = useState(initialQuery)
  const [tag, setTag] = useState('')
  const [results, setResults] = useState<Track[]>([])
  const [total, setTotal] = useState(0)
  const [demoMode, setDemoMode] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const { tracks: localTracks, removeTrack } = useLocalTracks()

  const load = useCallback(async (q: string, genre: string, offset: number) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    if (offset === 0) setLoading(true)
    else setLoadingMore(true)
    setError(null)

    try {
      const result = await searchMusic({ q, tag: genre, limit: 24, offset }, controller.signal)
      setResults((previous) => (offset === 0 ? result.tracks : [...previous, ...result.tracks]))
      setTotal(result.total)
      setDemoMode(result.demoMode)
      setNotice(result.notice ?? null)
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return
      setError('No se pudo cargar el catálogo. Comprueba que el servidor Node esté activo.')
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
        setLoadingMore(false)
      }
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load(query, tag, 0)
      const next = new URLSearchParams()
      if (query.trim()) next.set('q', query.trim())
      setSearchParams(next, { replace: true })
    }, query ? 380 : 0)
    return () => window.clearTimeout(timer)
  }, [query, tag, load, setSearchParams])

  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  return (
    <div className="space-y-4">
      <section className="panel relative overflow-hidden p-4 sm:p-6">
        <div className="pointer-events-none absolute -right-16 -top-20 h-[260px] w-[260px] rounded-full bg-brand/[0.13] blur-[90px]" />
        <div className="relative">
          <p className="label-xs flex items-center gap-1.5 text-brand">
            <Compass size={11} /> Explorador
          </p>
          <h1 className="mt-2 text-[24px] font-semibold tracking-[-0.02em] text-white sm:text-[28px]">
            Encuentra tu próxima canción
          </h1>
          <p className="mt-1.5 max-w-xl text-[12.5px] leading-relaxed text-neutral-400">
            Busca directamente en Jamendo y cárgala en el studio para transformarla en tiempo real.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            {SOURCES.map((source) => (
              <button
                key={source.id}
                disabled={!source.available}
                title={source.available ? 'Fuente activa' : 'Preparada para futuras versiones'}
                className={`chip ${source.available ? 'chip-active' : 'cursor-not-allowed opacity-60'} text-[11px]`}
              >
                {source.label}
                {!source.available && (
                  <span className="rounded bg-white/10 px-1 py-0.5 text-[8px] uppercase tracking-[0.08em]">Pronto</span>
                )}
              </button>
            ))}
            <span className="ml-1 hidden text-[10px] text-neutral-600 sm:block">
              Spotify y SoundCloud se integrarán como fuentes de metadatos y playlists.
            </span>
          </div>

          <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por canción, artista o álbum…"
                className="input h-10 pl-9 pr-9"
                aria-label="Buscar canciones"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-300"
                  aria-label="Limpiar búsqueda"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-black/30 px-3 py-2 text-[11px] text-neutral-500">
              <Sparkles size={12} className="text-brand/80" />
              {demoMode ? 'Catálogo demo' : 'Jamendo API'}
              <span className="num text-neutral-600">· {total} pistas</span>
            </div>
          </div>

          <div className="no-scrollbar -mx-1 mt-3 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
            {GENRES.map((genre) => (
              <button
                key={genre.id || 'all'}
                onClick={() => setTag(genre.id)}
                className={`chip ${tag === genre.id ? 'chip-active' : ''} text-[11px]`}
              >
                {genre.label}
              </button>
            ))}
          </div>

          {notice && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-brand/20 bg-brand/[0.06] px-3 py-2">
              <Cloud size={13} className="mt-0.5 shrink-0 text-brand/80" />
              <p className="text-[10.5px] leading-relaxed text-neutral-400">{notice}</p>
            </div>
          )}
        </div>
      </section>

      <section className="panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="label-xs flex items-center gap-1.5 text-brand">
              <UploadCloud size={11} /> Tus archivos
            </p>
            <p className="mt-1 text-[12px] text-neutral-400">
              Sube un MP3 o WAV y edítalo en el estudio. Nada sale de este dispositivo.
            </p>
          </div>
          {localTracks.length > 0 && (
            <UploadTracks variant="panel" />
          )}
        </div>

        {localTracks.length === 0 ? (
          <div className="px-3 pb-3">
            <UploadTracks variant="hero" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 border-t border-white/[0.06] p-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
            {localTracks.map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                queue={localTracks}
                onRemove={() => void removeTrack(track.id)}
              />
            ))}
          </div>
        )}
      </section>

      {error ? (
        <EmptyState
          icon={Music2}
          title="No pudimos cargar el catálogo"
          description={error}
          action={
            <button onClick={() => void load(query, tag, 0)} className="btn btn-primary text-[12px]">
              Reintentar
            </button>
          }
        />
      ) : loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="panel-flat overflow-hidden">
              <div className="skeleton aspect-square" />
              <div className="space-y-1.5 p-3">
                <div className="skeleton h-2.5 w-4/5 rounded" />
                <div className="skeleton h-2 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : results.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Sin resultados"
          description="Prueba con otro término de búsqueda o cambia el género para descubrir más música."
          action={
            <button
              onClick={() => {
                setQuery('')
                setTag('')
              }}
              className="btn btn-ghost text-[12px]"
            >
              Limpiar filtros
            </button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
            {results.map((track) => (
              <TrackCard key={`${track.id}-${track.streamUrl}`} track={track} queue={results} />
            ))}
          </div>

          <div className="panel divide-y divide-white/[0.05] p-1.5">
            <div className="px-2.5 py-2">
              <p className="label-xs">Vista de lista</p>
            </div>
            {results.slice(0, 8).map((track, index) => (
              <TrackRow key={`row-${track.id}`} track={track} queue={results} index={index} />
            ))}
          </div>

          {results.length < total && (
            <div className="flex justify-center pt-1">
              <button
                onClick={() => void load(query, tag, results.length)}
                disabled={loadingMore}
                className="btn btn-ghost text-[12px]"
              >
                {loadingMore ? <Loader2 size={13} className="animate-spin" /> : null}
                {loadingMore ? 'Cargando…' : 'Cargar más pistas'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

import { Clock3, HardDrive, Heart, ListMusic, Music2, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Cover } from './Cover'
import { UploadTracks } from './UploadTracks'
import { useLibrary } from '../context/LibraryContext'
import { useLocalTracks } from '../context/LocalTracksContext'
import { usePlayer } from '../context/PlayerContext'
import { formatTime } from '../lib/format'
import type { Track } from '../lib/types'

type Tab = 'queue' | 'recent' | 'favorites' | 'files'

const TABS: Array<{ id: Tab; label: string; icon: typeof ListMusic }> = [
  { id: 'queue', label: 'Cola', icon: ListMusic },
  { id: 'recent', label: 'Recientes', icon: Clock3 },
  { id: 'favorites', label: 'Favoritos', icon: Heart },
  { id: 'files', label: 'Archivos', icon: HardDrive },
]

export function LibraryPanel({ className = '' }: { className?: string }) {
  const { queue, recent, current, playTrack, isPlaying } = usePlayer()
  const { favorites } = useLibrary()
  const { tracks: localTracks } = useLocalTracks()
  const [tab, setTab] = useState<Tab>('queue')
  const [query, setQuery] = useState('')

  const source = useMemo<Track[]>(() => {
    if (tab === 'queue') return queue
    if (tab === 'recent') return recent
    if (tab === 'files') return localTracks
    return favorites.map((record) => record.track)
  }, [tab, queue, recent, favorites, localTracks])

  const tracks = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return source
    return source.filter((track) =>
      `${track.title} ${track.artist} ${track.album}`.toLowerCase().includes(needle),
    )
  }, [source, query])

  return (
    <aside className={`panel flex min-h-0 flex-col overflow-hidden ${className}`}>
      <div className="border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music2 size={14} className="text-brand" />
            <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-200">
              Biblioteca
            </h2>
          </div>
          <span className="num text-[10px] text-neutral-500">{tracks.length}</span>
        </div>

        <div className="relative mt-3">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-600" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filtrar en la biblioteca"
            className="input py-1.5 pl-8 text-[12px]"
            aria-label="Filtrar en la biblioteca"
          />
        </div>

        <div className="mt-2.5 flex gap-1">
          {TABS.map((item) => {
            const Icon = item.icon
            const active = tab === item.id
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-1.5 py-1.5 text-[10.5px] font-medium transition ${
                  active
                    ? 'bg-brand/12 text-brand-soft ring-1 ring-inset ring-brand/30'
                    : 'text-neutral-500 hover:bg-white/5 hover:text-neutral-300'
                }`}
              >
                <Icon size={11} /> {item.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {tab === 'files' && (
          <div className="mb-1.5 px-1">
            <UploadTracks variant="panel" className="justify-center" />
          </div>
        )}
        {tracks.length === 0 ? (
          <div className="flex h-full min-h-[180px] flex-col items-center justify-center gap-2 px-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-white/[0.03] text-neutral-600">
              <Music2 size={16} />
            </div>
            <p className="text-[12px] text-neutral-400">
              {tab === 'favorites'
                ? 'Aún no tienes favoritos.'
                : tab === 'recent'
                  ? 'Todavía no has reproducido nada.'
                  : tab === 'files'
                    ? 'Aún no has subido archivos.'
                    : 'La cola está vacía.'}
            </p>
            <p className="text-[10.5px] leading-relaxed text-neutral-600">
              {tab === 'files'
                ? 'Arrastra un MP3 o WAV o usa el botón de arriba.'
                : 'Explora el catálogo y pulsa una pista para cargarla aquí.'}
            </p>
          </div>
        ) : (
          <ul className="space-y-0.5">
            {tracks.map((track, index) => {
              const active = current?.id === track.id
              return (
                <li key={`${track.id}-${index}`}>
                  <button
                    onClick={() => playTrack(track, tracks)}
                    className={`group flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition ${
                      active ? 'bg-brand/[0.10]' : 'hover:bg-white/[0.045]'
                    }`}
                  >
                    <span className="num w-3.5 shrink-0 text-[9.5px] text-neutral-600">
                      {active && isPlaying ? (
                        <span className="flex h-3 items-end gap-[1.5px]">
                          <span className="w-[2px] animate-[eq-idle_0.7s_ease-in-out_infinite] rounded-sm bg-brand" style={{ height: '100%' }} />
                          <span className="w-[2px] animate-[eq-idle_0.9s_ease-in-out_infinite] rounded-sm bg-brand" style={{ height: '100%' }} />
                          <span className="w-[2px] animate-[eq-idle_0.6s_ease-in-out_infinite] rounded-sm bg-brand" style={{ height: '100%' }} />
                        </span>
                      ) : (
                        (index + 1).toString().padStart(2, '0')
                      )}
                    </span>
                    <Cover track={track} className="h-8 w-8 shrink-0" rounded="rounded-md" />
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-[11.5px] font-medium ${active ? 'text-brand-soft' : 'text-neutral-200'}`}>
                        {track.title}
                      </span>
                      <span className="block truncate text-[10px] text-neutral-500">{track.artist}</span>
                    </span>
                    <span className="num shrink-0 text-[9.5px] text-neutral-600">
                      {formatTime(track.duration)}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="border-t border-white/[0.06] px-4 py-2">
        <p className="text-[9.5px] uppercase tracking-[0.12em] text-neutral-600">
          {tab === 'queue'
            ? 'Cola de reproducción'
            : tab === 'recent'
              ? 'Historial del dispositivo'
              : tab === 'files'
                ? 'Guardado en este dispositivo'
                : 'Guardado en tu cuenta'}
        </p>
      </div>
    </aside>
  )
}

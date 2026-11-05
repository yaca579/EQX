import { Heart, Pause, Play, Trash2 } from 'lucide-react'
import { Cover } from './Cover'
import { useLibrary } from '../context/LibraryContext'
import { usePlayer } from '../context/PlayerContext'
import { formatTime } from '../lib/format'
import type { Track } from '../lib/types'

interface TrackCardProps {
  track: Track
  queue?: Track[]
  compact?: boolean
  onRemove?: () => void
}

export function TrackCard({ track, queue, compact = false, onRemove }: TrackCardProps) {
  const { playTrack, current, isPlaying } = usePlayer()
  const { isFavorite, toggleFavorite } = useLibrary()
  const active = current?.id === track.id
  const favorite = isFavorite(track.id)

  return (
    <article
      className={`group relative overflow-hidden rounded-xl border transition-all duration-200 ${
        active
          ? 'border-brand/40 bg-brand/[0.06] shadow-[0_0_30px_-18px_rgba(255,106,0,0.9)]'
          : 'border-white/[0.06] bg-white/[0.018] hover:border-white/15 hover:bg-white/[0.035]'
      }`}
    >
      <div className="relative aspect-square overflow-hidden">
        <Cover track={track} className="h-full w-full transition-transform duration-500 group-hover:scale-[1.03]" rounded="rounded-none" />

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/10 opacity-70" />

        <button
          onClick={() => playTrack(track, queue)}
          className={`absolute bottom-2.5 right-2.5 flex h-9 w-9 translate-y-1 items-center justify-center rounded-full bg-gradient-to-b from-[#FF8A3D] to-[#F25F00] text-[#170d05] opacity-0 shadow-[0_10px_24px_-10px_rgba(0,0,0,0.9)] transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 hover:brightness-110 active:scale-95 ${
            active ? 'translate-y-0 opacity-100' : ''
          }`}
          aria-label={active && isPlaying ? `Pausar ${track.title}` : `Reproducir ${track.title}`}
        >
          {active && isPlaying ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" className="ml-0.5" />}
        </button>

        {track.source !== 'local' && (
          <button
            onClick={(event) => {
              event.stopPropagation()
              void toggleFavorite(track)
            }}
            className={`absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border backdrop-blur transition ${
              favorite
                ? 'border-brand/50 bg-black/60 text-brand'
                : 'border-white/15 bg-black/45 text-white/70 opacity-0 group-hover:opacity-100 hover:text-white'
            }`}
            aria-label={favorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
          >
            <Heart size={12.5} fill={favorite ? 'currentColor' : 'none'} />
          </button>
        )}

        {onRemove && (
          <button
            onClick={(event) => {
              event.stopPropagation()
              onRemove()
            }}
            className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white/70 backdrop-blur transition hover:border-red-400/50 hover:text-red-300"
            aria-label={`Eliminar ${track.title}`}
            title="Eliminar de este dispositivo"
          >
            <Trash2 size={12} />
          </button>
        )}

        <span className="num absolute bottom-2.5 left-2.5 rounded-md bg-black/55 px-1.5 py-0.5 text-[9.5px] text-white/85 backdrop-blur">
          {formatTime(track.duration)}
        </span>

        {track.source === 'demo' && (
          <span className="absolute left-2 top-2 rounded-md border border-white/15 bg-black/45 px-1.5 py-0.5 text-[8.5px] font-semibold uppercase tracking-[0.1em] text-white/70 backdrop-blur">
            Demo
          </span>
        )}
        {track.source === 'local' && (
          <span className="num absolute left-2 bottom-2.5 rounded-md border border-brand/30 bg-black/60 px-1.5 py-0.5 text-[8.5px] font-semibold uppercase tracking-[0.1em] text-brand-soft backdrop-blur">
            Local
          </span>
        )}
      </div>

      <div className={compact ? 'px-2.5 py-2' : 'px-3 py-2.5'}>
        <p className={`truncate text-[12.5px] font-semibold ${active ? 'text-brand-soft' : 'text-neutral-100'}`}>
          {track.title}
        </p>
        <p className="mt-0.5 truncate text-[10.5px] text-neutral-500">{track.artist}</p>
        {!compact && track.album && (
          <p className="mt-0.5 truncate text-[10px] text-neutral-600">{track.album}</p>
        )}
      </div>
    </article>
  )
}

import { Play } from 'lucide-react'
import { usePlayer } from '../context/PlayerContext'
import { Cover } from './Cover'
import { formatTime } from '../lib/format'
import type { Track } from '../lib/types'

interface TrackRowProps {
  track: Track
  queue: Track[]
  index: number
}

export function TrackRow({ track, queue, index }: TrackRowProps) {
  const { playTrack, current, isPlaying } = usePlayer()
  const active = current?.id === track.id

  return (
    <button
      onClick={() => playTrack(track, queue)}
      className={`group grid w-full grid-cols-[24px_40px_minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-2.5 py-2 text-left transition ${
        active ? 'bg-brand/[0.08]' : 'hover:bg-white/[0.04]'
      }`}
    >
      <span className="num text-[10px] text-neutral-600">
        {active && isPlaying ? (
          <Play size={11} className="text-brand" fill="currentColor" />
        ) : (
          (index + 1).toString().padStart(2, '0')
        )}
      </span>
      <Cover track={track} className="h-10 w-10" rounded="rounded-md" />
      <span className="min-w-0">
        <span className={`block truncate text-[12.5px] font-medium ${active ? 'text-brand-soft' : 'text-neutral-200'}`}>
          {track.title}
        </span>
        <span className="mt-0.5 block truncate text-[10.5px] text-neutral-500">
          {track.artist}
          {track.album ? ` · ${track.album}` : ''}
        </span>
      </span>
      <span className="flex items-center gap-3">
        {track.source === 'jamendo' && (
          <span className="hidden rounded border border-white/10 px-1.5 py-0.5 text-[8.5px] uppercase tracking-[0.1em] text-neutral-500 sm:block">
            Jamendo
          </span>
        )}
        <span className="num text-[10px] text-neutral-600">{formatTime(track.duration)}</span>
      </span>
    </button>
  )
}

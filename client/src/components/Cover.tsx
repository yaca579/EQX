import { useState } from 'react'
import { hashString, initials } from '../lib/format'
import type { Track } from '../lib/types'

const PALETTES: Array<[string, string, string]> = [
  ['#FF6A00', '#5C2200', '#160C05'],
  ['#FF8A3D', '#4A1C05', '#140D07'],
  ['#F2A03D', '#3D1E0A', '#14100A'],
  ['#FF7A2F', '#2E1408', '#0E0B08'],
  ['#D98A3F', '#33200F', '#12100C'],
  ['#FFB067', '#452312', '#150F0A'],
]

interface CoverProps {
  track: Pick<Track, 'id' | 'title' | 'artist' | 'cover'>
  className?: string
  rounded?: string
  showArtist?: boolean
}

export function Cover({ track, className = '', rounded = 'rounded-xl', showArtist = false }: CoverProps) {
  const [failed, setFailed] = useState(false)
  const palette = PALETTES[hashString(track.id) % PALETTES.length]
  const showImage = Boolean(track.cover) && !failed

  return (
    <div
      className={`relative overflow-hidden ${rounded} ${className}`}
      style={{ background: `linear-gradient(145deg, ${palette[0]}, ${palette[1]} 58%, ${palette[2]})` }}
    >
      {showImage ? (
        <img
          src={track.cover ?? ''}
          alt={`Portada de ${track.title}`}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <>
          <div
            className="absolute inset-0 opacity-70"
            style={{
              backgroundImage:
                'radial-gradient(circle at 26% 18%, rgba(255,255,255,0.36), transparent 46%), radial-gradient(circle at 84% 92%, rgba(0,0,0,0.5), transparent 55%)',
            }}
          />
          <svg viewBox="0 0 100 100" className="absolute inset-x-0 bottom-0 h-2/3 w-full opacity-45" aria-hidden>
            <g fill="rgba(15,15,15,0.55)">
              {[8, 20, 32, 44, 56, 68, 80].map((x, index) => {
                const heights = [22, 44, 62, 34, 54, 28, 42]
                return <rect key={x} x={x} y={100 - heights[index]} width="5" height={heights[index]} rx="2.5" />
              })}
            </g>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="num text-[clamp(11px,16%,26px)] font-semibold tracking-wider text-black/45">
              {initials(track.artist || track.title)}
            </span>
          </div>
        </>
      )}

      <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/10" />
      {showArtist && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-6">
          <p className="truncate text-[11px] font-medium text-white/80">{track.artist}</p>
        </div>
      )}
    </div>
  )
}

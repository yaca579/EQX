import { Compass, Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { TrackCard } from '../components/TrackCard'
import { useLibrary } from '../context/LibraryContext'

export function FavoritesPage() {
  const { favorites, loading } = useLibrary()
  const tracks = favorites.map((record) => record.track)

  return (
    <div className="space-y-4">
      <section className="panel relative overflow-hidden px-4 py-5 sm:px-6">
        <div className="pointer-events-none absolute -right-10 -top-16 h-52 w-52 rounded-full bg-brand/[0.12] blur-[80px]" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="label-xs flex items-center gap-1.5 text-brand">
              <Heart size={11} /> Tu colección
            </p>
            <h1 className="mt-2 text-[24px] font-semibold tracking-[-0.02em] text-white">Favoritos</h1>
            <p className="mt-1 text-[12.5px] text-neutral-400">
              {tracks.length === 0
                ? 'Guarda las canciones que quieras transformar después.'
                : `${tracks.length} ${tracks.length === 1 ? 'canción guardada' : 'canciones guardadas'} en tu cuenta.`}
            </p>
          </div>
          <Link to="/explore" className="btn btn-ghost text-[12px]">
            <Compass size={13} /> Descubrir más
          </Link>
        </div>
      </section>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
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
      ) : tracks.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Todavía no tienes favoritos"
          description="Pulsa el corazón en cualquier pista del explorador o del reproductor para guardarla aquí."
          action={
            <Link to="/explore" className="btn btn-primary text-[12px]">
              <Compass size={13} /> Explorar canciones
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
          {tracks.map((track) => (
            <TrackCard key={track.id} track={track} queue={tracks} />
          ))}
        </div>
      )}
    </div>
  )
}

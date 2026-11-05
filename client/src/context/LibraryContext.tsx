import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'
import type { FavoriteRecord, Track } from '../lib/types'
import { deleteFavorite, fetchFavorites, saveFavorite } from '../services/storage'

interface LibraryContextValue {
  favorites: FavoriteRecord[]
  loading: boolean
  isFavorite: (trackId: string) => boolean
  toggleFavorite: (track: Track) => Promise<void>
  refresh: () => Promise<void>
}

const LibraryContext = createContext<LibraryContextValue | null>(null)

export function LibraryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [favorites, setFavorites] = useState<FavoriteRecord[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) {
      setFavorites([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      setFavorites(await fetchFavorites(user.uid))
    } catch (error) {
      console.warn('[library] No se pudieron cargar los favoritos', error)
      toast('No se pudieron cargar tus favoritos.', 'error')
    } finally {
      setLoading(false)
    }
  }, [toast, user])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const isFavorite = useCallback(
    (trackId: string) => favorites.some((record) => record.track.id === trackId),
    [favorites],
  )

  const toggleFavorite = useCallback(
    async (track: Track) => {
      if (!user) return
      const exists = favorites.some((record) => record.track.id === track.id)
      const previous = favorites

      setFavorites((current) =>
        exists
          ? current.filter((record) => record.track.id !== track.id)
          : [{ track, addedAt: Date.now() }, ...current],
      )

      try {
        if (exists) await deleteFavorite(user.uid, track.id)
        else await saveFavorite(user.uid, track)
        toast(exists ? 'Quitado de favoritos' : 'Añadido a favoritos', exists ? 'info' : 'success')
      } catch (error) {
        console.warn('[library] No se pudo actualizar el favorito', error)
        setFavorites(previous)
        toast('No se pudo guardar el favorito.', 'error')
      }
    },
    [favorites, toast, user],
  )

  const value = useMemo<LibraryContextValue>(
    () => ({ favorites, loading, isFavorite, toggleFavorite, refresh }),
    [favorites, loading, isFavorite, toggleFavorite, refresh],
  )

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}

export function useLibrary(): LibraryContextValue {
  const context = useContext(LibraryContext)
  if (!context) throw new Error('useLibrary debe usarse dentro de LibraryProvider')
  return context
}

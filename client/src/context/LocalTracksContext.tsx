import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Track } from '../lib/types'
import {
  createLocalFile,
  deleteLocalFile,
  isSupportedAudio,
  listLocalFiles,
  MAX_FILE_BYTES,
  toLocalTrack,
  type LocalFileRecord,
} from '../services/localAudio'
import { useAuth } from './AuthContext'
import { usePlayer } from './PlayerContext'
import { useToast } from './ToastContext'

interface LocalTracksContextValue {
  tracks: Track[]
  files: LocalFileRecord[]
  loading: boolean
  uploading: boolean
  addFiles: (incoming: FileList | File[]) => Promise<void>
  removeTrack: (trackId: string) => Promise<void>
}

const LocalTracksContext = createContext<LocalTracksContextValue | null>(null)

export function LocalTracksProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const { playTrack } = usePlayer()
  const [files, setFiles] = useState<LocalFileRecord[]>([])
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const urlsRef = useRef<Map<string, string>>(new Map())

  const load = useCallback(async (uid: string | null) => {
    setLoading(true)
    try {
      const records = uid ? await listLocalFiles(uid) : []
      // Los object URLs anteriores dejan de ser válidos al recargar.
      urlsRef.current.forEach((url) => URL.revokeObjectURL(url))
      const urls = new Map<string, string>()
      const nextTracks = records.map((record) => {
        const url = URL.createObjectURL(record.blob)
        urls.set(record.id, url)
        return toLocalTrack(record, url)
      })
      urlsRef.current = urls
      setFiles(records)
      setTracks(nextTracks)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(user?.uid ?? null)
  }, [load, user?.uid])

  useEffect(() => {
    const urls = urlsRef.current
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
      urls.clear()
    }
  }, [])

  const addFiles = useCallback(
    async (incoming: FileList | File[]) => {
      if (!user) {
        toast('Inicia sesión para añadir tus archivos.', 'error')
        return
      }
      const list = Array.from(incoming)
      if (!list.length) return

      let skipped = 0
      const accepted: File[] = []
      for (const file of list) {
        const duplicate = files.some(
          (record) => record.fileName === file.name && record.size === file.size,
        )
        if (!isSupportedAudio(file) || file.size > MAX_FILE_BYTES || duplicate) {
          skipped += 1
          continue
        }
        accepted.push(file)
      }

      if (!accepted.length) {
        toast(
          skipped
            ? 'No se añadió nada: formato no compatible, archivo repetido o más de 80 MB.'
            : 'No se seleccionó ningún archivo.',
          'error',
        )
        return
      }

      setUploading(true)
      try {
        const addedRecords: LocalFileRecord[] = []
        for (const file of accepted) {
          const record = await createLocalFile(user.uid, file)
          const url = URL.createObjectURL(record.blob)
          urlsRef.current.set(record.id, url)
          addedRecords.push(record)
        }
        const addedTracks = addedRecords.map((record) =>
          toLocalTrack(record, urlsRef.current.get(record.id) ?? ''),
        )
        setFiles((current) => [...addedRecords, ...current])
        setTracks((current) => [...addedTracks, ...current])

        const first = addedTracks[0]
        if (first) playTrack(first, [...addedTracks, ...tracks])

        toast(
          addedRecords.length === 1
            ? `«${addedRecords[0].title}» lista para editar.`
            : `${addedRecords.length} archivos añadidos a tu biblioteca.`,
          'success',
        )
        if (skipped) toast(`${skipped} archivo(s) omitidos por formato, tamaño o duplicado.`, 'info')
      } catch (error) {
        console.warn('[local] No se pudo guardar el archivo', error)
        toast('No se pudo guardar el archivo en este dispositivo.', 'error')
      } finally {
        setUploading(false)
      }
    },
    [files, playTrack, toast, tracks, user],
  )

  const removeTrack = useCallback(
    async (trackId: string) => {
      const recordId = trackId.replace(/^local:/, '')
      const record = files.find((item) => item.id === recordId)
      try {
        await deleteLocalFile(recordId)
        const url = urlsRef.current.get(recordId)
        if (url) {
          URL.revokeObjectURL(url)
          urlsRef.current.delete(recordId)
        }
        setFiles((current) => current.filter((item) => item.id !== recordId))
        setTracks((current) => current.filter((item) => item.id !== trackId))
        toast(record ? `«${record.title}» eliminada del dispositivo.` : 'Archivo eliminado.', 'info')
      } catch (error) {
        console.warn('[local] No se pudo eliminar el archivo', error)
        toast('No se pudo eliminar el archivo.', 'error')
      }
    },
    [files, toast],
  )

  const value = useMemo<LocalTracksContextValue>(
    () => ({ tracks, files, loading, uploading, addFiles, removeTrack }),
    [tracks, files, loading, uploading, addFiles, removeTrack],
  )

  return <LocalTracksContext.Provider value={value}>{children}</LocalTracksContext.Provider>
}

export function useLocalTracks(): LocalTracksContextValue {
  const context = useContext(LocalTracksContext)
  if (!context) throw new Error('useLocalTracks debe usarse dentro de LocalTracksProvider')
  return context
}

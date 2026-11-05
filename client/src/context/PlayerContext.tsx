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
import { getEngine } from '../audio/engine'
import type { Track } from '../lib/types'
import { pushRecentTrack, readRecentTracks, readVolume, writeVolume } from '../services/storage'

interface PlayerContextValue {
  current: Track | null
  queue: Track[]
  index: number
  isPlaying: boolean
  isLoading: boolean
  time: number
  duration: number
  volume: number
  recent: Track[]
  playTrack: (track: Track, queue?: Track[]) => void
  playQueue: (tracks: Track[], startIndex?: number) => void
  toggle: () => void
  next: () => void
  previous: () => void
  seek: (seconds: number) => void
  setVolume: (value: number) => void
}

const PlayerContext = createContext<PlayerContextValue | null>(null)

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<Track | null>(null)
  const [queue, setQueue] = useState<Track[]>([])
  const [index, setIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(readVolume)
  const [recent, setRecent] = useState<Track[]>(readRecentTracks)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const shouldPlayRef = useRef(false)
  const engine = getEngine()

  const attachAudio = useCallback(
    (element: HTMLAudioElement | null) => {
      audioRef.current = element
      if (element) engine.attach(element)
    },
    [engine],
  )

  useEffect(() => {
    engine.setVolume(volume)
  }, [engine, volume])

  // Carga la pista actual en el elemento de audio.
  useEffect(() => {
    const element = audioRef.current
    if (!element || !current) return
    if (element.dataset.trackId === current.id) return

    element.dataset.trackId = current.id
    element.src = current.streamUrl
    element.load()
    setTime(0)
    setDuration(current.duration || 0)
    setIsLoading(true)
    setRecent(pushRecentTrack(current))

    if (shouldPlayRef.current) {
      engine.resume()
      void element.play().catch(() => {
        setIsLoading(false)
        setIsPlaying(false)
      })
    }
  }, [current, engine])

  useEffect(() => {
    writeVolume(volume)
  }, [volume])

  // Media Session para controles del sistema
  useEffect(() => {
    if (!('mediaSession' in navigator) || !current) return
    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.title,
      artist: current.artist,
      album: current.album,
      artwork: current.cover
        ? [{ src: current.cover, sizes: '512x512', type: 'image/jpeg' }]
        : undefined,
    })
    navigator.mediaSession.setActionHandler('play', () => {
      engine.resume()
      void audioRef.current?.play()
    })
    navigator.mediaSession.setActionHandler('pause', () => audioRef.current?.pause())
  }, [current, engine])

  const playAt = useCallback((tracks: Track[], position: number, autoPlay = true) => {
    const safePosition = Math.max(0, Math.min(tracks.length - 1, position))
    const track = tracks[safePosition]
    if (!track) return
    shouldPlayRef.current = autoPlay
    setQueue(tracks)
    setIndex(safePosition)
    setCurrent((previous) => {
      if (previous && previous.id === track.id) {
        // misma pista: no recargar, solo continuar
        return previous
      }
      return track
    })
  }, [])

  const playQueue = useCallback(
    (tracks: Track[], startIndex = 0) => {
      if (!tracks.length) return
      playAt(tracks, startIndex)
    },
    [playAt],
  )

  const playTrack = useCallback(
    (track: Track, list?: Track[]) => {
      if (current?.id === track.id) {
        const element = audioRef.current
        if (!element) return
        if (element.paused) {
          engine.resume()
          void element.play()
        } else {
          element.pause()
        }
        return
      }
      const tracks = list && list.length ? list : [track]
      const position = Math.max(0, tracks.findIndex((item) => item.id === track.id))
      playAt(tracks, position)
    },
    [current?.id, engine, playAt],
  )

  const toggle = useCallback(() => {
    const element = audioRef.current
    if (!element) return
    if (!current) {
      if (queue.length) playAt(queue, 0)
      return
    }
    engine.resume()
    if (element.paused) void element.play()
    else element.pause()
  }, [current, engine, playAt, queue])

  const next = useCallback(() => {
    if (!queue.length) return
    const position = queue.length === 1 ? 0 : (index + 1) % queue.length
    const wasPlaying = isPlaying
    shouldPlayRef.current = wasPlaying
    setIndex(position)
    setCurrent(queue[position])
    if (wasPlaying) {
      // el efecto de carga reinicia el src de la siguiente pista
      const element = audioRef.current
      if (element) element.dataset.trackId = ''
    }
  }, [index, isPlaying, queue])

  const previous = useCallback(() => {
    const element = audioRef.current
    if (element && element.currentTime > 3) {
      element.currentTime = 0
      return
    }
    if (!queue.length) return
    const position = queue.length === 1 ? 0 : (index - 1 + queue.length) % queue.length
    shouldPlayRef.current = isPlaying
    setIndex(position)
    setCurrent(queue[position])
    const node = audioRef.current
    if (node) node.dataset.trackId = ''
  }, [index, isPlaying, queue])

  const seek = useCallback((seconds: number) => {
    const element = audioRef.current
    if (!element) return
    const total = Number.isFinite(element.duration) ? element.duration : duration
    element.currentTime = Math.max(0, Math.min(total || 0, seconds))
    setTime(element.currentTime)
  }, [duration])

  const setVolume = useCallback((value: number) => {
    setVolumeState(Math.min(1, Math.max(0, value)))
  }, [])

  const handleEnded = useCallback(() => {
    if (queue.length > 1) {
      const position = (index + 1) % queue.length
      shouldPlayRef.current = true
      const node = audioRef.current
      if (node) node.dataset.trackId = ''
      setIndex(position)
      setCurrent(queue[position])
      return
    }
    setIsPlaying(false)
    if (audioRef.current) audioRef.current.currentTime = 0
  }, [index, queue])

  const value = useMemo<PlayerContextValue>(
    () => ({
      current,
      queue,
      index,
      isPlaying,
      isLoading,
      time,
      duration,
      volume,
      recent,
      playTrack,
      playQueue,
      toggle,
      next,
      previous,
      seek,
      setVolume,
    }),
    [
      current,
      queue,
      index,
      isPlaying,
      isLoading,
      time,
      duration,
      volume,
      recent,
      playTrack,
      playQueue,
      toggle,
      next,
      previous,
      seek,
      setVolume,
    ],
  )

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio
        ref={attachAudio}
        crossOrigin="anonymous"
        preload="metadata"
        playsInline
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => {
          setIsLoading(false)
          setIsPlaying(true)
        }}
        onCanPlay={() => setIsLoading(false)}
        onLoadedMetadata={(event) => {
          const value = event.currentTarget.duration
          if (Number.isFinite(value)) setDuration(value)
        }}
        onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
        onEnded={handleEnded}
        onError={() => {
          setIsLoading(false)
          setIsPlaying(false)
          console.warn('[player] No se pudo reproducir el audio de la pista actual')
        }}
        className="hidden"
      />
    </PlayerContext.Provider>
  )
}

export function usePlayer(): PlayerContextValue {
  const context = useContext(PlayerContext)
  if (!context) throw new Error('usePlayer debe usarse dentro de PlayerProvider')
  return context
}

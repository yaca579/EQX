export type TrackSource = 'demo' | 'jamendo' | 'spotify' | 'soundcloud' | 'local'

export interface Track {
  id: string
  source: TrackSource
  title: string
  artist: string
  album: string
  /** Duración en segundos */
  duration: number
  cover: string | null
  /** URL reproducible (mismo origen: proxy del backend) */
  streamUrl: string
  externalUrl?: string
  tags?: string[]
}

export interface FavoriteRecord {
  track: Track
  addedAt: number
}

export type MusicSourceId = 'jamendo' | 'demo' | 'spotify' | 'soundcloud'

export interface MusicSourceInfo {
  id: MusicSourceId
  name: string
  available: boolean
  description: string
}

export interface TrackSearchResult {
  tracks: Track[]
  total: number
  demoMode: boolean
  notice?: string
  source: MusicSourceId
}

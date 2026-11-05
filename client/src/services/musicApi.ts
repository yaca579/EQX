import type { Track, TrackSearchResult } from '../lib/types'

export interface SearchParams {
  q?: string
  tag?: string
  limit?: number
  offset?: number
}

async function request(path: string, signal?: AbortSignal): Promise<TrackSearchResult> {
  const response = await fetch(path, { signal, headers: { Accept: 'application/json' } })
  if (!response.ok) {
    let detail = ''
    try {
      const body = (await response.json()) as { error?: string }
      detail = body.error ?? ''
    } catch {
      detail = response.statusText
    }
    throw new Error(detail || 'No se pudo conectar con el servidor de música.')
  }
  const data = (await response.json()) as Partial<TrackSearchResult>
  const tracks = Array.isArray(data.tracks) ? (data.tracks as Track[]) : []
  return {
    tracks: tracks.filter((track) => Boolean(track?.id && track?.streamUrl)),
    total: typeof data.total === 'number' ? data.total : tracks.length,
    demoMode: Boolean(data.demoMode),
    notice: data.notice,
    source: data.source ?? 'demo',
  }
}

export async function searchMusic(params: SearchParams, signal?: AbortSignal): Promise<TrackSearchResult> {
  const query = new URLSearchParams()
  if (params.q) query.set('q', params.q)
  if (params.tag) query.set('tag', params.tag)
  query.set('limit', String(params.limit ?? 24))
  query.set('offset', String(params.offset ?? 0))
  return request(`/api/music/search?${query.toString()}`, signal)
}

export async function fetchTrending(limit = 12, signal?: AbortSignal): Promise<TrackSearchResult> {
  return request(`/api/music/trending?limit=${limit}`, signal)
}

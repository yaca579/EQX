/** Cliente de la API de Jamendo (v3.0) con caché en memoria. */

const BASE = 'https://api.jamendo.com/v3.0'
const CLIENT_ID = (process.env.JAMENDO_CLIENT_ID ?? '').trim()

export const jamendoEnabled = Boolean(CLIENT_ID)

const cache = new Map()
const CACHE_TTL = 1000 * 60 * 10

function cacheGet(key) {
  const entry = cache.get(key)
  if (!entry) return null
  if (entry.expires < Date.now()) {
    cache.delete(key)
    return null
  }
  return entry.value
}

function cacheSet(key, value) {
  if (cache.size > 120) {
    const oldest = cache.keys().next().value
    if (oldest) cache.delete(oldest)
  }
  cache.set(key, { value, expires: Date.now() + CACHE_TTL })
}

async function request(pathname, params) {
  if (!jamendoEnabled) throw new Error('Jamendo no está configurado')

  const url = new URL(`${BASE}${pathname}`)
  url.searchParams.set('client_id', CLIENT_ID)
  url.searchParams.set('format', 'json')
  url.searchParams.set('audioformat', 'mp32')
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    url.searchParams.set(key, String(value))
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12000)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json', 'User-Agent': 'EQX/1.0' },
    })
    if (!response.ok) throw new Error(`Jamendo respondió ${response.status}`)
    const data = await response.json()
    if (data?.headers?.status === 'failed') {
      throw new Error(data.headers.error_message || 'Error de Jamendo')
    }
    return data
  } finally {
    clearTimeout(timeout)
  }
}

function mapTrack(track) {
  return {
    id: `jamendo-${track.id}`,
    source: 'jamendo',
    title: track.name,
    artist: track.artist_name,
    album: track.album_name ?? '',
    duration: Number(track.duration) || 0,
    cover: track.album_image || track.image || null,
    streamUrl: `/api/stream/jamendo-${track.id}`,
    externalUrl: track.shareurl,
    tags: track.musicinfo?.tags?.genres ?? [],
  }
}

export async function searchJamendo({ query = '', tag = '', limit = 24, offset = 0 } = {}) {
  const key = `search:${query}:${tag}:${limit}:${offset}`
  const cached = cacheGet(key)
  if (cached) return cached

  const data = await request('/tracks/', {
    search: query || undefined,
    tags: tag || undefined,
    limit: Math.min(200, Math.max(1, limit)),
    offset: Math.max(0, offset),
    order: query ? 'relevance' : 'popularity_total',
    include: 'musicinfo',
    imagesize: 600,
  })

  const result = {
    tracks: (data?.results ?? []).map(mapTrack).filter((track) => track.streamUrl),
    total: Number(data?.headers?.results_count) || (data?.results?.length ?? 0),
  }
  cacheSet(key, result)
  return result
}

export async function trendingJamendo(limit = 12) {
  const key = `trending:${limit}`
  const cached = cacheGet(key)
  if (cached) return cached

  const data = await request('/tracks/', {
    limit: Math.min(100, Math.max(1, limit)),
    order: 'popularity_week',
    include: 'musicinfo',
    imagesize: 600,
  })

  const result = {
    tracks: (data?.results ?? []).map(mapTrack).filter((track) => track.streamUrl),
    total: Number(data?.headers?.results_count) || (data?.results?.length ?? 0),
  }
  cacheSet(key, result)
  return result
}

function assertJamendoHost(url) {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.toLowerCase()
    const allowed =
      host === 'jamendo.com' || host.endsWith('.jamendo.com') || host.endsWith('.jamendo.org')
    return parsed.protocol === 'https:' && allowed ? parsed.toString() : null
  } catch {
    return null
  }
}

/** Resuelve la URL de audio real de una pista de Jamendo (cacheada). */
export async function resolveJamendoAudio(trackId) {
  const key = `audio:${trackId}`
  const cached = cacheGet(key)
  if (cached) return cached

  const numericId = String(trackId).replace(/^jamendo-/, '')
  if (!/^\d+$/.test(numericId)) return null

  const data = await request('/tracks/', {
    id: numericId,
    limit: 1,
    include: 'musicinfo',
  })

  const track = data?.results?.[0]
  if (!track) return null

  const candidate = assertJamendoHost(track.audio) ?? assertJamendoHost(track.audiodownload)
  if (!candidate) return null

  cacheSet(key, candidate)
  return candidate
}

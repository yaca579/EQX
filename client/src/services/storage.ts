import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore'
import { firestore, usingFirebase } from '../lib/firebase'
import type { Preset } from '../lib/presets'
import { sanitizeState } from '../lib/studio'
import type { FavoriteRecord, Track } from '../lib/types'

function localKey(scope: string, uid: string): string {
  return `audiomods:${scope}:${uid}`
}

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeLocal(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.warn('[storage] No se pudo guardar en localStorage', error)
  }
}

export function favoriteDocId(trackId: string): string {
  return trackId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120)
}

// ── Presets ──────────────────────────────────────────────────────────────

function normalizePreset(id: string, data: Record<string, unknown>): Preset {
  return {
    id,
    name: typeof data.name === 'string' && data.name.trim() ? data.name : 'Preset sin nombre',
    description: typeof data.description === 'string' ? data.description : undefined,
    state: sanitizeState(data.state),
    createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
  }
}

export async function fetchPresets(uid: string): Promise<Preset[]> {
  if (usingFirebase && firestore) {
    const snapshot = await getDocs(collection(firestore, 'users', uid, 'presets'))
    return snapshot.docs
      .map((item) => normalizePreset(item.id, item.data() as Record<string, unknown>))
      .sort((a, b) => b.createdAt - a.createdAt)
  }

  const stored = readLocal<Preset[]>(localKey('presets', uid), [])
  return stored
    .map((preset) => normalizePreset(preset.id, preset as unknown as Record<string, unknown>))
    .sort((a, b) => b.createdAt - a.createdAt)
}

export async function storePreset(uid: string, preset: Preset): Promise<void> {
  if (usingFirebase && firestore) {
    await setDoc(doc(firestore, 'users', uid, 'presets', preset.id), {
      name: preset.name,
      description: preset.description ?? null,
      state: preset.state,
      createdAt: preset.createdAt,
    })
    return
  }

  const stored = readLocal<Preset[]>(localKey('presets', uid), [])
  const next = [preset, ...stored.filter((item) => item.id !== preset.id)]
  writeLocal(localKey('presets', uid), next)
}

export async function removePreset(uid: string, presetId: string): Promise<void> {
  if (usingFirebase && firestore) {
    await deleteDoc(doc(firestore, 'users', uid, 'presets', presetId))
    return
  }
  const stored = readLocal<Preset[]>(localKey('presets', uid), [])
  writeLocal(
    localKey('presets', uid),
    stored.filter((item) => item.id !== presetId),
  )
}

// ── Favoritos ────────────────────────────────────────────────────────────

export async function fetchFavorites(uid: string): Promise<FavoriteRecord[]> {
  if (usingFirebase && firestore) {
    const snapshot = await getDocs(collection(firestore, 'users', uid, 'favorites'))
    return snapshot.docs
      .map((item) => {
        const data = item.data() as { track?: Track; addedAt?: number }
        return { track: data.track as Track, addedAt: data.addedAt ?? 0 }
      })
      .filter((record) => Boolean(record.track?.id))
      .sort((a, b) => b.addedAt - a.addedAt)
  }

  return readLocal<FavoriteRecord[]>(localKey('favorites', uid), []).sort(
    (a, b) => b.addedAt - a.addedAt,
  )
}

export async function saveFavorite(uid: string, track: Track): Promise<void> {
  const record: FavoriteRecord = { track, addedAt: Date.now() }
  if (usingFirebase && firestore) {
    await setDoc(doc(firestore, 'users', uid, 'favorites', favoriteDocId(track.id)), {
      track,
      addedAt: record.addedAt,
    })
    return
  }
  const stored = await fetchFavorites(uid)
  const next = [record, ...stored.filter((item) => item.track.id !== track.id)]
  writeLocal(localKey('favorites', uid), next)
}

export async function deleteFavorite(uid: string, trackId: string): Promise<void> {
  if (usingFirebase && firestore) {
    await deleteDoc(doc(firestore, 'users', uid, 'favorites', favoriteDocId(trackId)))
    return
  }
  const stored = await fetchFavorites(uid)
  writeLocal(
    localKey('favorites', uid),
    stored.filter((item) => item.track.id !== trackId),
  )
}

// ── Historial local (por dispositivo) ────────────────────────────────────

const RECENT_KEY = 'audiomods:recent'

export function readRecentTracks(): Track[] {
  // Los archivos subidos usan object URLs que sólo viven en esta sesión.
  return readLocal<Track[]>(RECENT_KEY, [])
    .filter((track) => track?.source !== 'local')
    .slice(0, 12)
}

export function pushRecentTrack(track: Track): Track[] {
  const stored = readRecentTracks()
  if (track.source === 'local') return stored
  const next = [track, ...stored.filter((item) => item.id !== track.id)].slice(0, 12)
  writeLocal(RECENT_KEY, next)
  return next
}

// ── Preferencias ─────────────────────────────────────────────────────────

const VOLUME_KEY = 'audiomods:volume'

export function readVolume(): number {
  const value = readLocal<number>(VOLUME_KEY, 0.85)
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0.85
}

export function writeVolume(value: number) {
  writeLocal(VOLUME_KEY, value)
}

import type { Track } from '../lib/types'

const DB_NAME = 'eqx-audio'
const DB_VERSION = 1
const STORE = 'files'

export const ACCEPTED_AUDIO =
  '.mp3,.wav,.m4a,.ogg,.flac,audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/ogg,audio/flac'

/** 80 MB: suficiente para un WAV de varios minutos sin llenar el navegador. */
export const MAX_FILE_BYTES = 80 * 1024 * 1024

export interface LocalFileRecord {
  id: string
  ownerUid: string
  title: string
  artist: string
  album: string
  /** Duración en segundos (0 si el navegador no pudo leerla) */
  duration: number
  fileName: string
  mime: string
  size: number
  addedAt: number
  blob: Blob
}

let dbPromise: Promise<IDBDatabase | null> | null = null

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve(null)
      return
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' })
        store.createIndex('ownerUid', 'ownerUid', { unique: false })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => resolve(null)
    request.onblocked = () => resolve(null)
  })
  return dbPromise
}

function runRequest<T>(
  db: IDBDatabase,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const request = run(tx.objectStore(STORE))
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB error'))
  })
}

export function isSupportedAudio(file: File): boolean {
  if (file.type.startsWith('audio/')) return true
  return /\.(mp3|wav|m4a|ogg|flac)$/i.test(file.name)
}

export function audioLabel(mime: string, fileName: string): string {
  const fromName = fileName.split('.').pop()?.toUpperCase()
  if (fromName && fromName.length <= 5) return fromName
  if (mime.includes('mpeg')) return 'MP3'
  if (mime.includes('wav')) return 'WAV'
  return 'AUDIO'
}

export function titleFromFileName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, '')
  const clean = base.replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim()
  return clean || 'Pista sin título'
}

/** Lee la duración real del archivo sin subirlo a ningún sitio. */
export function probeDuration(blob: Blob): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob)
    const audio = new Audio()
    let settled = false
    const finish = (value: number) => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      audio.removeAttribute('src')
      URL.revokeObjectURL(url)
      resolve(value)
    }
    const timer = window.setTimeout(() => finish(0), 10000)
    audio.preload = 'metadata'
    audio.onloadedmetadata = () =>
      finish(Number.isFinite(audio.duration) ? audio.duration : 0)
    audio.onerror = () => finish(0)
    audio.src = url
  })
}

export async function listLocalFiles(ownerUid: string): Promise<LocalFileRecord[]> {
  const db = await openDb()
  if (!db) return []
  try {
    const all = await runRequest<LocalFileRecord[]>(
      db,
      'readonly',
      (store) => store.getAll() as IDBRequest<LocalFileRecord[]>,
    )
    return all
      .filter((record) => record.ownerUid === ownerUid)
      .sort((a, b) => b.addedAt - a.addedAt)
  } catch {
    return []
  }
}

export async function createLocalFile(
  ownerUid: string,
  file: File,
): Promise<LocalFileRecord> {
  const duration = await probeDuration(file)
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  const record: LocalFileRecord = {
    id,
    ownerUid,
    title: titleFromFileName(file.name),
    artist: 'Archivo local',
    album: `${audioLabel(file.type, file.name)} · ${formatBytes(file.size)}`,
    duration,
    fileName: file.name,
    mime: file.type || 'audio/mpeg',
    size: file.size,
    addedAt: Date.now(),
    blob: file,
  }

  const db = await openDb()
  if (!db) throw new Error('Este navegador no permite guardar archivos localmente')
  await runRequest(db, 'readwrite', (store) => store.put(record))
  return record
}

export async function deleteLocalFile(id: string): Promise<void> {
  const db = await openDb()
  if (!db) return
  await runRequest(db, 'readwrite', (store) => store.delete(id))
}

export function toLocalTrack(record: LocalFileRecord, streamUrl: string): Track {
  return {
    id: `local:${record.id}`,
    source: 'local',
    title: record.title,
    artist: record.artist,
    album: record.album,
    duration: record.duration,
    cover: null,
    streamUrl,
  }
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

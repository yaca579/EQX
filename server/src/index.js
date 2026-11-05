import cors from 'cors'
import express from 'express'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { Readable } from 'node:stream'
import { fileURLToPath } from 'node:url'
import { DEMO_DIR, ensureDemoAudio } from './demoAudio.js'
import { DEMO_TRACKS, listDemoTracks } from './demoTracks.js'
import { jamendoEnabled, resolveJamendoAudio, searchJamendo, trendingJamendo } from './jamendo.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const parsedPort = Number(process.env.PORT)
const PORT = Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : 8787
const CLIENT_DIST = path.resolve(__dirname, '../../client/dist')

const app = express()
app.disable('x-powered-by')
app.use(cors())
app.use(express.json({ limit: '64kb' }))

// Catálogo demo generado (WAV) — soporta Range para poder buscar dentro de la pista.
app.use(
  '/demo',
  express.static(DEMO_DIR, {
    maxAge: '1h',
    setHeaders: (res) => res.setHeader('Access-Control-Allow-Origin', '*'),
  }),
)

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    jamendo: jamendoEnabled,
    demo: !jamendoEnabled,
    demoDir: DEMO_DIR,
    time: new Date().toISOString(),
  })
})

app.get('/api/music/search', async (req, res) => {
  const query = String(req.query.q ?? '').slice(0, 120)
  const tag = String(req.query.tag ?? '').slice(0, 60)
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 24))
  const offset = Math.max(0, Number(req.query.offset) || 0)

  if (!jamendoEnabled) {
    const tracks = listDemoTracks(query, tag)
    return res.json({
      tracks,
      total: tracks.length,
      demoMode: true,
      source: 'demo',
      notice: 'Catálogo demo activo. Añade JAMENDO_CLIENT_ID en el archivo .env para explorar todo Jamendo.',
    })
  }

  try {
    const result = await searchJamendo({ query, tag, limit, offset })
    return res.json({ ...result, demoMode: false, source: 'jamendo' })
  } catch (error) {
    console.warn('[jamendo] Búsqueda fallback a demo:', error.message)
    const tracks = listDemoTracks(query, tag)
    return res.json({
      tracks,
      total: tracks.length,
      demoMode: true,
      source: 'demo',
      notice: 'Jamendo no respondió. Mostrando el catálogo demo local.',
    })
  }
})

app.get('/api/music/trending', async (req, res) => {
  const limit = Math.min(30, Math.max(1, Number(req.query.limit) || 12))

  if (!jamendoEnabled) {
    return res.json({
      tracks: DEMO_TRACKS.slice(0, limit),
      total: DEMO_TRACKS.length,
      demoMode: true,
      source: 'demo',
      notice: null,
    })
  }

  try {
    const result = await trendingJamendo(limit)
    return res.json({ ...result, demoMode: false, source: 'jamendo' })
  } catch (error) {
    console.warn('[jamendo] Trending fallback a demo:', error.message)
    return res.json({
      tracks: DEMO_TRACKS.slice(0, limit),
      total: DEMO_TRACKS.length,
      demoMode: true,
      source: 'demo',
      notice: 'Jamendo no respondió. Mostrando el catálogo demo local.',
    })
  }
})

/**
 * Proxy de audio de Jamendo. Sirve el MP3 desde el mismo origen para que
 * Web Audio API pueda analizarlo (la API exige CORS para el espectro).
 */
app.get('/api/stream/:id', async (req, res) => {
  if (!jamendoEnabled) {
    return res.status(503).json({ error: 'Jamendo no está configurado.' })
  }

  try {
    const audioUrl = await resolveJamendoAudio(req.params.id)
    if (!audioUrl) return res.status(404).json({ error: 'Pista no disponible.' })

    const headers = { Accept: 'audio/mpeg,*/*' }
    if (req.headers.range) headers.Range = req.headers.range

    const upstream = await fetch(audioUrl, { headers, redirect: 'follow' })
    if (!upstream.ok && upstream.status !== 206) {
      return res.status(502).json({ error: 'No se pudo obtener el audio desde Jamendo.' })
    }

    res.status(upstream.status)
    for (const header of [
      'content-type',
      'content-length',
      'accept-ranges',
      'content-range',
      'etag',
      'last-modified',
    ]) {
      const value = upstream.headers.get(header)
      if (value) res.setHeader(header, value)
    }
    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.setHeader('Access-Control-Allow-Origin', '*')

    if (!upstream.body) return res.end()
    Readable.fromWeb(upstream.body)
      .on('error', () => res.destroy())
      .pipe(res)
  } catch (error) {
    console.warn('[stream] Error:', error.message)
    if (!res.headersSent) res.status(502).json({ error: 'Error al reproducir la pista.' })
    else res.destroy()
  }
})

// Cliente compilado (producción). En desarrollo Vite sirve el frontend.
if (existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST, { maxAge: '1h', index: false }))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next()
    res.sendFile(path.join(CLIENT_DIST, 'index.html'))
  })
}

ensureDemoAudio()
console.log(`[eqx] Catálogo demo disponible en ${DEMO_DIR}`)

app.listen(PORT, () => {
  console.log(`[eqx] API lista en http://localhost:${PORT}`)
  console.log(
    jamendoEnabled
      ? '[eqx] Jamendo conectado.'
      : '[eqx] Jamendo sin configurar — usando catálogo demo local.',
  )
})

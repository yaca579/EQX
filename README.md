# EQX

Estudio web para **reproducir canciones y transformar su sonido en tiempo real** sin exportar archivos.
Interfaz oscura inspirada en plugins profesionales (FabFilter Pro-Q, Ableton, FL Studio) con acento naranja `#FF6A00`.

![stack](https://img.shields.io/badge/React-19-0F0F0F) ![stack](https://img.shields.io/badge/TypeScript-5.8-0F0F0F) ![stack](https://img.shields.io/badge/Node-Express-0F0F0F) ![stack](https://img.shields.io/badge/Web%20Audio%20API-real--time-FF6A00)

---

## Puesta en marcha

```bash
npm install
npm run dev
```

- Frontend: <http://localhost:5173>
- API: <http://localhost:8787>

La app funciona **sin configurar nada**: usa el catálogo demo sintetizado en local y autenticación
local por navegador. Para Jamendo y Firestore reales, copia `.env.example` a `.env` y rellena las claves.

```bash
cp .env.example .env
```

### Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Frontend + backend en paralelo |
| `npm run dev:web` | Sólo Vite |
| `npm run dev:server` | Sólo API Node (`--watch`) |
| `npm run build` | Typecheck + build de producción del cliente |
| `npm run typecheck` | TypeScript en modo estricto |
| `npm start` | Servidor Node (sirve `client/dist` si existe) |
| `npm run demo:audio` | Regenera las 4 pistas demo en WAV |

---

## Jamendo

1. Crea una app en <https://devportal.jamendo.com>.
2. Copia el **Client ID** en `JAMENDO_CLIENT_ID` dentro de `.env`.
3. Reinicia el backend.

El backend expone:

- `GET /api/music/search?q=&tag=&limit=&offset=` — búsqueda (orden por relevancia).
- `GET /api/music/trending?limit=` — populares de la semana.
- `GET /api/stream/:id` — proxy del MP3 con soporte de `Range`.

**Por qué un proxy:** la Web Audio API necesita CORS para poder analizar el audio
(`MediaElementAudioSourceNode` + `AnalyserNode`). Sirviendo el MP3 desde el mismo origen, el
visualizador y todo el procesado funcionan con cualquier pista de Jamendo. El proxy valida que la
URL de audio pertenezca a dominios de Jamendo (evita SSRF) y cachea la resolución 10 minutos.

Sin `JAMENDO_CLIENT_ID`, el backend responde con el catálogo demo y un aviso en la interfaz explicando
cómo activarlo.

## Firebase

1. Crea un proyecto en <https://console.firebase.google.com>.
2. Activa **Authentication → Email/Password** (y Google si quieres el botón social).
3. Crea una base **Firestore** y publica las reglas de `firestore.rules`.
4. Copia la configuración del SDK web a las variables `VITE_FIREBASE_*`.

Modelo de datos:

```
users/{uid}
  presets/{presetId}     → { name, description, state, createdAt }
  favorites/{trackId}    → { track, addedAt }
```

Cada usuario sólo puede leer y escribir su propio subárbol (ver `firestore.rules`).

**Sin Firebase** la app entra en *modo local*: cuentas, favoritos y presets se guardan en
`localStorage` del navegador. El badge del menú de usuario indica el modo activo.

## Catálogo demo

El servidor sintetiza cuatro pistas originales (`Neon Drift`, `Midnight Tape`, `Sub Pressure`,
`Vocal Aura`) con osciladores, ruido, delays y compresión. Se generan en `server/public/demo/*.wav`
la primera vez que arranca el servidor, así que el estudio, el ecualizador y todos los efectos
funcionan sin conexión ni claves.

---

## Arquitectura

```
eqx/
├─ client/                 React + TypeScript + Tailwind v4
│  └─ src/
│     ├─ audio/            Motor de Web Audio (grafo, efectos, reverb, curvas)
│     ├─ components/       UI: knobs, EQ canvas, spectrum, player, paneles…
│     ├─ context/          Auth, Player, Studio, Library, Presets, Toasts
│     ├─ lib/              Estado del estudio, presets, share links, Firebase
│     ├─ pages/            Login, Dashboard, Explorar, Studio, Favoritos, Presets
│     └─ services/         API de música y persistencia (Firestore / localStorage)
└─ server/                 Node + Express
   └─ src/
      ├─ demoAudio.js      Síntesis del catálogo demo
      ├─ jamendo.js        Cliente Jamendo + caché + resolución de audio
      └─ index.js          API, proxy de audio y estáticos
```

### Cadena de audio

```
<audio> → MediaElementSource
        → EQ (lowshelf · peaking · highshelf · 10 bandas paramétricas)
        → Bass Boost → Super Bass → Vocal Boost → Distortion
        → Lo-Fi → Vinyl → Reverb → Slow+Reverb → 8D
        → Gain → Balance estéreo → Volumen → Analyser → Limitador → salida
```

- Cada efecto es un slot **dry/wet** con crossfade suave: se pueden combinar todos a la vez.
- El EQ dibuja la **respuesta real** de los filtros (`getFrequencyResponse`), no una aproximación.
- El visualizador usa FFT de 4096 con escalas logarítmicas y *peak hold*.
- `Slowed`, `Speed Up` y `Slow + Reverb` actúan sobre `playbackRate` (con `preservesPitch = false`),
  por eso cambian tempo **y** tono, como en las versiones slowed/nightcore.
- Un limitador de seguridad evita clipping al acumular refuerzos de graves.

### Presets compartidos

El botón **Compartir** genera un enlace autocontenido:

```
https://…/studio?preset=<estado comprimido en base64url>
```

Quien lo abra importa el preset automáticamente. No requiere backend ni permisos de lectura en
Firestore, y el contenido se valida y se acota al importarlo (`sanitizeState`).

## Funcionalidad

- **Explorador**: búsqueda, filtros de género, carga incremental, favoritos, vista de tarjetas y lista.
- **Reproductor**: play/pausa, anterior/siguiente, progreso interactivo, volumen, selector de
  velocidad (0.5×–2×), Media Session y cola.
- **Studio**: biblioteca, visualizador de espectro, EQ gráfico de 10 bandas con curva arrastrable,
  Bass/Mid/Treble, Gain, Balance, 11 efectos combinables y medidores de estado.
- **Presets**: guardar/cargar/eliminar, 8 presets de fábrica y enlaces compartibles.
- **Responsive**: layout de tres columnas con raíl de navegación en escritorio; pestañas
  Biblioteca/Editor/Efectos y dock de reproducción en móvil.

## Fuentes de música

`jamendo` es la fuente activa. La capa de servicios está preparada para añadir Spotify y SoundCloud
como fuentes de metadatos/playlists (aparecen como “Pronto” en el explorador): basta implementar un
adaptador de búsqueda que devuelva `Track[]` y registrarlo en el cliente.

## Notas

- El `MediaElementSource` se crea una sola vez por elemento de audio; por eso `main.tsx` no usa
  `StrictMode` (el doble montaje en desarrollo rompería el grafo).
- En producción, restringe `cors()` a tu dominio y sirve la app detrás de HTTPS.
- `npm run build` deja el cliente en `client/dist`; `npm start` lo sirve desde el mismo origen que la API.

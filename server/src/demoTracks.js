export const DEMO_TRACK_SPECS = [
  {
    id: 'demo-neon-drift',
    file: 'neon-drift.wav',
    title: 'Neon Drift',
    artist: 'Audio Mods Lab',
    album: 'Demo Sessions · Vol. 1',
    bpm: 104,
    bars: 16,
    tags: ['synthwave', 'electronic', 'retro'],
  },
  {
    id: 'demo-midnight-tape',
    file: 'midnight-tape.wav',
    title: 'Midnight Tape',
    artist: 'Audio Mods Lab',
    album: 'Demo Sessions · Vol. 1',
    bpm: 84,
    bars: 12,
    tags: ['lofi', 'chill', 'hiphop'],
  },
  {
    id: 'demo-sub-pressure',
    file: 'sub-pressure.wav',
    title: 'Sub Pressure',
    artist: 'Audio Mods Lab',
    album: 'Demo Sessions · Vol. 2',
    bpm: 126,
    bars: 16,
    tags: ['techno', 'club', 'bass'],
  },
  {
    id: 'demo-vocal-aura',
    file: 'vocal-aura.wav',
    title: 'Vocal Aura',
    artist: 'Audio Mods Lab',
    album: 'Demo Sessions · Vol. 2',
    bpm: 88,
    bars: 12,
    tags: ['ambient', 'vocal', 'cinematic'],
  },
]

export function demoDurationSeconds(spec) {
  return Math.round(spec.bars * 4 * (60 / spec.bpm))
}

export const DEMO_TRACKS = DEMO_TRACK_SPECS.map((spec) => ({
  id: spec.id,
  source: 'demo',
  title: spec.title,
  artist: spec.artist,
  album: spec.album,
  duration: demoDurationSeconds(spec),
  cover: null,
  streamUrl: `/demo/${spec.file}`,
  tags: spec.tags,
}))

export function listDemoTracks(query = '', tag = '') {
  const needle = query.trim().toLowerCase()
  const genre = tag.trim().toLowerCase()

  return DEMO_TRACKS.filter((track) => {
    const matchesQuery =
      !needle ||
      `${track.title} ${track.artist} ${track.album} ${(track.tags ?? []).join(' ')}`
        .toLowerCase()
        .includes(needle)
    const matchesTag = !genre || (track.tags ?? []).some((item) => item.toLowerCase() === genre)
    return matchesQuery && matchesTag
  })
}

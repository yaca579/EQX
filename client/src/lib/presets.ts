import {
  cloneState,
  defaultStudioState,
  type EffectId,
  type StudioState,
} from './studio'

export interface Preset {
  id: string
  name: string
  description?: string
  state: StudioState
  createdAt: number
  builtin?: boolean
}

function effects(overrides: Partial<Record<EffectId, { enabled: boolean; amount?: number }>>) {
  const base = defaultStudioState().effects
  for (const [id, value] of Object.entries(overrides)) {
    base[id as EffectId] = { enabled: value.enabled, amount: value.amount ?? 0.5 }
  }
  return base
}

function bands(values: number[]): number[] {
  return values.slice(0, 10)
}

function makePreset(
  id: string,
  name: string,
  description: string,
  state: StudioState,
): Preset {
  return { id, name, description, state: cloneState(state), createdAt: 0, builtin: true }
}

export const FACTORY_PRESETS: Preset[] = [
  makePreset('factory-flat', 'Flat Studio', 'Referencia neutra, sin coloración.', defaultStudioState()),

  makePreset('factory-bass-cathedral', 'Bass Cathedral', 'Subgraves profundos con cola de sala.', {
    ...defaultStudioState(),
    bands: bands([6, 7, 4, 1, 0, -1, -1, -1, -2, -3]),
    bass: 5,
    treble: -1,
    effects: effects({ bassBoost: { enabled: true, amount: 0.8 }, superBass: { enabled: true, amount: 0.45 }, reverb: { enabled: true, amount: 0.35 } }),
    speed: 1,
  }),

  makePreset('factory-slow-reverb', 'Slow + Reverb', 'La versión ralentizada de cada canción.', {
    ...defaultStudioState(),
    bands: bands([3, 3, 2, 1, 0, 0, 0, -1, -3, -5]),
    bass: 2,
    treble: -2,
    effects: effects({ slowReverb: { enabled: true }, reverb: { enabled: true, amount: 0.28 }, vinyl: { enabled: true, amount: 0.22 } }),
    speed: 1,
  }),

  makePreset('factory-nightcore', 'Nightcore', 'Rápido, brillante y con energía.', {
    ...defaultStudioState(),
    bands: bands([-2, -1, 0, 0, 0, 1, 2, 3, 2, 1]),
    mid: 1,
    treble: 2,
    effects: effects({ speedUp: { enabled: true }, vocalBoost: { enabled: true, amount: 0.4 } }),
    speed: 1,
  }),

  makePreset('factory-lofi-tape', 'Lo-Fi Tape', 'Cinta gastada, filtro cálido y vinilo.', {
    ...defaultStudioState(),
    bands: bands([3, 2, 1, 0, -1, -1, -2, -4, -7, -9]),
    bass: 2,
    treble: -4,
    effects: effects({ lofi: { enabled: true, amount: 0.62 }, vinyl: { enabled: true, amount: 0.55 } }),
    speed: 1,
  }),

  makePreset('factory-vocal-air', 'Vocal Air', 'Voz al frente con aire y espacio.', {
    ...defaultStudioState(),
    bands: bands([-1, -1, -1, -2, 0, 1, 3, 2, 1, 0]),
    mid: 2,
    effects: effects({ vocalBoost: { enabled: true, amount: 0.7 }, reverb: { enabled: true, amount: 0.3 } }),
    speed: 1,
  }),

  makePreset('factory-8d-orbit', '8D Orbit', 'Paneo orbital envolvente con reverb.', {
    ...defaultStudioState(),
    bands: bands([2, 2, 1, 0, 0, 0, 1, 1, 2, 2]),
    effects: effects({ eightD: { enabled: true, amount: 0.82 }, reverb: { enabled: true, amount: 0.32 } }),
    speed: 1,
  }),

  makePreset('factory-club-pressure', 'Club Pressure', 'Bajos al límite con saturación.', {
    ...defaultStudioState(),
    bands: bands([5, 5, 3, 0, -1, -1, 0, 1, 0, -1]),
    bass: 4,
    gain: -2,
    effects: effects({ bassBoost: { enabled: true, amount: 0.9 }, superBass: { enabled: true, amount: 0.7 }, distortion: { enabled: true, amount: 0.2 } }),
    speed: 1,
  }),
]

export function findFactoryPreset(id: string): Preset | undefined {
  return FACTORY_PRESETS.find((preset) => preset.id === id)
}

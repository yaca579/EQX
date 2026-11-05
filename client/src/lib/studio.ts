export const EQ_FREQUENCIES = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000] as const

export const EQ_BAND_LABELS = ['31', '62', '125', '250', '500', '1K', '2K', '4K', '8K', '16K']

export const EQ_FREQUENCY_LABELS = ['20', '50', '100', '200', '500', '1K', '2K', '5K', '10K', '20K']

export const EQ_MIN_DB = -18
export const EQ_MAX_DB = 18

export type EffectId =
  | 'bassBoost'
  | 'superBass'
  | 'vocalBoost'
  | 'reverb'
  | 'slowReverb'
  | 'slowed'
  | 'speedUp'
  | 'eightD'
  | 'lofi'
  | 'vinyl'
  | 'distortion'

export interface EffectState {
  enabled: boolean
  /** 0 – 1 */
  amount: number
}

export type EffectsState = Record<EffectId, EffectState>

export type ToneBand = 'bass' | 'mid' | 'treble'

export interface StudioState {
  /** Ganancia en dB de cada banda del EQ gráfico */
  bands: number[]
  /** dB de los estantes de tono */
  bass: number
  mid: number
  treble: number
  /** dB de ganancia de salida */
  gain: number
  /** -1 (izquierda) … 1 (derecha) */
  balance: number
  effects: EffectsState
  /** Velocidad elegida por el usuario */
  speed: number
}

export interface EffectMeta {
  label: string
  description: string
  tag: 'Graves' | 'Medios' | 'Espacio' | 'Tempo' | 'Estéreo' | 'Textura'
  hasAmount: boolean
  amountLabel?: string
}

/** Orden de las tarjetas en el panel de efectos */
export const EFFECT_ORDER: EffectId[] = [
  'bassBoost',
  'superBass',
  'vocalBoost',
  'reverb',
  'slowReverb',
  'slowed',
  'speedUp',
  'eightD',
  'lofi',
  'vinyl',
  'distortion',
]

export const EFFECT_META: Record<EffectId, EffectMeta> = {
  bassBoost: {
    label: 'Bass Boost',
    description: 'Refuerzo cálido de graves para dar cuerpo a la mezcla.',
    tag: 'Graves',
    hasAmount: true,
    amountLabel: 'Refuerzo',
  },
  superBass: {
    label: 'Super Bass',
    description: 'Subgraves profundos estilo club, con presión real.',
    tag: 'Graves',
    hasAmount: true,
    amountLabel: 'Presión',
  },
  vocalBoost: {
    label: 'Vocal Boost',
    description: 'Presencia y claridad en la voz sin harshness.',
    tag: 'Medios',
    hasAmount: true,
    amountLabel: 'Presencia',
  },
  reverb: {
    label: 'Reverb',
    description: 'Espacio y profundidad de sala con cola suave.',
    tag: 'Espacio',
    hasAmount: true,
    amountLabel: 'Mezcla',
  },
  slowReverb: {
    label: 'Slow + Reverb',
    description: 'Tempo ralentizado con cola ambiental extendida.',
    tag: 'Tempo',
    hasAmount: false,
  },
  slowed: {
    label: 'Slowed',
    description: 'Baja el tempo y el tono, estilo versión ralentizada.',
    tag: 'Tempo',
    hasAmount: false,
  },
  speedUp: {
    label: 'Speed Up',
    description: 'Acelera el tempo y el tono, estilo nightcore.',
    tag: 'Tempo',
    hasAmount: false,
  },
  eightD: {
    label: '8D Audio',
    description: 'Paneo orbital con LFO que rodea al oyente.',
    tag: 'Estéreo',
    hasAmount: true,
    amountLabel: 'Órbita',
  },
  lofi: {
    label: 'Lo-Fi',
    description: 'Filtro cálido, banda limitada y saturación de cinta.',
    tag: 'Textura',
    hasAmount: true,
    amountLabel: 'Textura',
  },
  vinyl: {
    label: 'Vinyl',
    description: 'Crujido, siseo y ruido de vinilo auténtico.',
    tag: 'Textura',
    hasAmount: true,
    amountLabel: 'Ruido',
  },
  distortion: {
    label: 'Distortion',
    description: 'Saturación armónica controlada y agresiva.',
    tag: 'Textura',
    hasAmount: true,
    amountLabel: 'Drive',
  },
}

export const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2]

export const DEFAULT_EFFECTS: EffectsState = {
  bassBoost: { enabled: false, amount: 0.55 },
  superBass: { enabled: false, amount: 0.5 },
  vocalBoost: { enabled: false, amount: 0.5 },
  reverb: { enabled: false, amount: 0.35 },
  slowReverb: { enabled: false, amount: 0.6 },
  slowed: { enabled: false, amount: 1 },
  speedUp: { enabled: false, amount: 1 },
  eightD: { enabled: false, amount: 0.75 },
  lofi: { enabled: false, amount: 0.5 },
  vinyl: { enabled: false, amount: 0.5 },
  distortion: { enabled: false, amount: 0.35 },
}

export function defaultStudioState(): StudioState {
  return {
    bands: EQ_FREQUENCIES.map(() => 0),
    bass: 0,
    mid: 0,
    treble: 0,
    gain: 0,
    balance: 0,
    effects: cloneEffects(DEFAULT_EFFECTS),
    speed: 1,
  }
}

export function cloneEffects(effects: EffectsState): EffectsState {
  const next = {} as EffectsState
  for (const id of EFFECT_ORDER) {
    const effect = effects[id]
    next[id] = { enabled: Boolean(effect?.enabled), amount: clamp(effect?.amount ?? 0.5, 0, 1) }
  }
  return next
}

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, value))
}

export function round(value: number, decimals = 1): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

export function cloneState(state: StudioState): StudioState {
  return {
    bands: state.bands.map((value) => round(clamp(value, EQ_MIN_DB, EQ_MAX_DB), 1)),
    bass: round(clamp(state.bass, -12, 12), 1),
    mid: round(clamp(state.mid, -12, 12), 1),
    treble: round(clamp(state.treble, -12, 12), 1),
    gain: round(clamp(state.gain, -12, 12), 1),
    balance: round(clamp(state.balance, -1, 1), 2),
    effects: cloneEffects(state.effects),
    speed: SPEED_OPTIONS.includes(state.speed) ? state.speed : 1,
  }
}

/** Normaliza cualquier entrada (Firestore, enlace compartido, preset antiguo). */
export function sanitizeState(input: unknown): StudioState {
  const base = defaultStudioState()
  if (!input || typeof input !== 'object') return base
  const raw = input as Partial<StudioState> & { effects?: Partial<EffectsState> }

  const bands = Array.isArray(raw.bands)
    ? base.bands.map((_, index) => {
        const value = raw.bands?.[index]
        return typeof value === 'number' ? round(clamp(value, EQ_MIN_DB, EQ_MAX_DB), 1) : 0
      })
    : base.bands

  const effects = { ...base.effects }
  if (raw.effects && typeof raw.effects === 'object') {
    for (const id of EFFECT_ORDER) {
      const source = raw.effects[id] as Partial<EffectState> | undefined
      if (!source) continue
      effects[id] = {
        enabled: Boolean(source.enabled),
        amount: typeof source.amount === 'number' ? round(clamp(source.amount, 0, 1), 2) : base.effects[id].amount,
      }
    }
  }

  const num = (value: unknown, fallback: number, min: number, max: number) =>
    typeof value === 'number' ? round(clamp(value, min, max), 1) : fallback

  return {
    bands,
    bass: num(raw.bass, 0, -12, 12),
    mid: num(raw.mid, 0, -12, 12),
    treble: num(raw.treble, 0, -12, 12),
    gain: num(raw.gain, 0, -12, 12),
    balance: typeof raw.balance === 'number' ? round(clamp(raw.balance, -1, 1), 2) : 0,
    effects,
    speed: typeof raw.speed === 'number' && SPEED_OPTIONS.includes(raw.speed) ? raw.speed : 1,
  }
}

/** Multiplicador de tempo aportado por los efectos rítmicos. */
export function tempoMultiplier(effects: EffectsState): number {
  let multiplier = 1
  if (effects.slowReverb.enabled) multiplier *= 0.84
  if (effects.slowed.enabled) multiplier *= 0.85
  if (effects.speedUp.enabled) multiplier *= 1.22
  return multiplier
}

export function effectiveTempo(state: StudioState): number {
  return clamp(state.speed * tempoMultiplier(state.effects), 0.25, 4)
}

export function activeEffects(effects: EffectsState): EffectId[] {
  return EFFECT_ORDER.filter((id) => effects[id].enabled)
}

export function countActiveEffects(effects: EffectsState): number {
  return activeEffects(effects).length
}

export function isStudioStateEqual(a: StudioState, b: StudioState): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

/** Ecuación aproximada para la respuesta combinada mostrada en la curva. */
export function formatDb(value: number): string {
  const rounded = Math.abs(value) < 0.05 ? 0 : value
  return `${rounded > 0 ? '+' : ''}${rounded.toFixed(1)}`
}

export function formatHz(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)} kHz`
  return `${Math.round(value)} Hz`
}

export function formatBalance(value: number): string {
  if (Math.abs(value) < 0.02) return 'Centro'
  const amount = Math.round(Math.abs(value) * 100)
  return `${value < 0 ? 'L' : 'R'} ${amount}`
}

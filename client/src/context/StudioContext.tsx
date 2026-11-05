import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getEngine } from '../audio/engine'
import type { Preset } from '../lib/presets'
import {
  activeEffects,
  clamp,
  cloneState,
  countActiveEffects,
  defaultStudioState,
  effectiveTempo,
  isStudioStateEqual,
  round,
  type EffectId,
  type StudioState,
  type ToneBand,
} from '../lib/studio'

interface StudioContextValue {
  state: StudioState
  presetLabel: string
  isDirty: boolean
  activeCount: number
  tempo: number
  activeList: EffectId[]
  setBand: (index: number, gain: number) => void
  setTone: (band: ToneBand, gain: number) => void
  setGain: (gain: number) => void
  setBalance: (balance: number) => void
  setSpeed: (speed: number) => void
  toggleEffect: (id: EffectId) => void
  setEffectAmount: (id: EffectId, amount: number) => void
  applyPreset: (preset: Preset) => void
  applyState: (state: StudioState, label?: string) => void
  reset: () => void
  setPresetLabel: (label: string) => void
}

const StudioContext = createContext<StudioContextValue | null>(null)

export function StudioProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StudioState>(defaultStudioState)
  const [presetLabel, setPresetLabel] = useState('Flat Studio')
  const [baseline, setBaseline] = useState<StudioState>(() => defaultStudioState())
  const engine = getEngine()

  useEffect(() => {
    engine.applyState(state)
  }, [engine, state])

  const mutate = useCallback((updater: (previous: StudioState) => StudioState) => {
    setState((previous) => cloneState(updater(previous)))
  }, [])

  const setBand = useCallback(
    (index: number, gain: number) => {
      mutate((previous) => {
        const bands = [...previous.bands]
        bands[index] = round(clamp(gain, -18, 18), 1)
        return { ...previous, bands }
      })
    },
    [mutate],
  )

  const setTone = useCallback(
    (band: ToneBand, gain: number) => {
      mutate((previous) => ({ ...previous, [band]: round(clamp(gain, -12, 12), 1) }))
    },
    [mutate],
  )

  const setGain = useCallback(
    (gain: number) => {
      mutate((previous) => ({ ...previous, gain: round(clamp(gain, -12, 12), 1) }))
    },
    [mutate],
  )

  const setBalance = useCallback(
    (balance: number) => {
      mutate((previous) => ({ ...previous, balance: round(clamp(balance, -1, 1), 2) }))
    },
    [mutate],
  )

  const setSpeed = useCallback((speed: number) => {
    setState((previous) => ({ ...previous, speed }))
  }, [])

  const toggleEffect = useCallback(
    (id: EffectId) => {
      mutate((previous) => ({
        ...previous,
        effects: {
          ...previous.effects,
          [id]: { ...previous.effects[id], enabled: !previous.effects[id].enabled },
        },
      }))
    },
    [mutate],
  )

  const setEffectAmount = useCallback(
    (id: EffectId, amount: number) => {
      mutate((previous) => ({
        ...previous,
        effects: {
          ...previous.effects,
          [id]: { ...previous.effects[id], amount: round(clamp(amount, 0, 1), 2) },
        },
      }))
    },
    [mutate],
  )

  const applyState = useCallback((next: StudioState, label = 'Personalizado') => {
    const sanitized = cloneState(next)
    setState(sanitized)
    setBaseline(sanitized)
    setPresetLabel(label)
  }, [])

  const applyPreset = useCallback(
    (preset: Preset) => {
      applyState(preset.state, preset.name)
    },
    [applyState],
  )

  const reset = useCallback(() => {
    const fresh = defaultStudioState()
    setState(fresh)
    setBaseline(fresh)
    setPresetLabel('Flat Studio')
  }, [])

  const activeList = useMemo(() => activeEffects(state.effects), [state.effects])
  const tempo = useMemo(() => effectiveTempo(state), [state])

  const value = useMemo<StudioContextValue>(
    () => ({
      state,
      presetLabel,
      isDirty: !isStudioStateEqual(state, baseline),
      activeCount: countActiveEffects(state.effects),
      tempo,
      activeList,
      setBand,
      setTone,
      setGain,
      setBalance,
      setSpeed,
      toggleEffect,
      setEffectAmount,
      applyPreset,
      applyState,
      reset,
      setPresetLabel,
    }),
    [
      state,
      presetLabel,
      baseline,
      tempo,
      activeList,
      setBand,
      setTone,
      setGain,
      setBalance,
      setSpeed,
      toggleEffect,
      setEffectAmount,
      applyPreset,
      applyState,
      reset,
    ],
  )

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>
}

export function useStudio(): StudioContextValue {
  const context = useContext(StudioContext)
  if (!context) throw new Error('useStudio debe usarse dentro de StudioProvider')
  return context
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { FACTORY_PRESETS, type Preset } from '../lib/presets'
import type { StudioState } from '../lib/studio'
import { fetchPresets, removePreset, storePreset } from '../services/storage'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'

interface PresetsContextValue {
  presets: Preset[]
  factoryPresets: Preset[]
  loading: boolean
  save: (name: string, state: StudioState) => Promise<Preset | null>
  remove: (presetId: string) => Promise<void>
  refresh: () => Promise<void>
}

const PresetsContext = createContext<PresetsContextValue | null>(null)

export function PresetsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [presets, setPresets] = useState<Preset[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) {
      setPresets([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      setPresets(await fetchPresets(user.uid))
    } catch (error) {
      console.warn('[presets] No se pudieron cargar los presets', error)
      toast('No se pudieron cargar tus presets.', 'error')
    } finally {
      setLoading(false)
    }
  }, [toast, user])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const save = useCallback(
    async (name: string, state: StudioState): Promise<Preset | null> => {
      if (!user) return null
      const preset: Preset = {
        id: `preset-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
        name: name.trim() || 'Preset sin nombre',
        state,
        createdAt: Date.now(),
      }
      try {
        await storePreset(user.uid, preset)
        setPresets((current) => [preset, ...current])
        toast(`Preset “${preset.name}” guardado`)
        return preset
      } catch (error) {
        console.warn('[presets] No se pudo guardar el preset', error)
        toast('No se pudo guardar el preset.', 'error')
        return null
      }
    },
    [toast, user],
  )

  const remove = useCallback(
    async (presetId: string) => {
      if (!user) return
      const previous = presets
      setPresets((current) => current.filter((preset) => preset.id !== presetId))
      try {
        await removePreset(user.uid, presetId)
        toast('Preset eliminado', 'info')
      } catch (error) {
        console.warn('[presets] No se pudo eliminar el preset', error)
        setPresets(previous)
        toast('No se pudo eliminar el preset.', 'error')
      }
    },
    [presets, toast, user],
  )

  const value = useMemo<PresetsContextValue>(
    () => ({
      presets,
      factoryPresets: FACTORY_PRESETS,
      loading,
      save,
      remove,
      refresh,
    }),
    [presets, loading, save, remove, refresh],
  )

  return <PresetsContext.Provider value={value}>{children}</PresetsContext.Provider>
}

export function usePresets(): PresetsContextValue {
  const context = useContext(PresetsContext)
  if (!context) throw new Error('usePresets debe usarse dentro de PresetsProvider')
  return context
}

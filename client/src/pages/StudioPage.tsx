import { Library as LibraryIcon, SlidersHorizontal, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AmpConsole } from '../components/AmpConsole'
import { EffectsPanel } from '../components/EffectsPanel'
import { EqPanel } from '../components/EqPanel'
import { LibraryPanel } from '../components/LibraryPanel'
import { PresetBar } from '../components/PresetBar'
import { SignalChain } from '../components/SignalChain'
import { useStudio } from '../context/StudioContext'
import { useToast } from '../context/ToastContext'
import { decodePreset } from '../lib/share'

type MobileTab = 'library' | 'editor' | 'effects'

const MOBILE_TABS: Array<{ id: MobileTab; label: string; icon: typeof LibraryIcon }> = [
  { id: 'library', label: 'Biblioteca', icon: LibraryIcon },
  { id: 'editor', label: 'Estudio', icon: SlidersHorizontal },
  { id: 'effects', label: 'Efectos', icon: Sparkles },
]

export function StudioPage() {
  const { applyState } = useStudio()
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const [mobileTab, setMobileTab] = useState<MobileTab>('editor')
  const imported = useRef(false)

  useEffect(() => {
    const payload = searchParams.get('preset')
    if (!payload || imported.current) return
    imported.current = true
    const decoded = decodePreset(payload)
    if (decoded) {
      applyState(decoded, 'Preset compartido')
      toast('Preset importado desde el enlace')
    } else {
      toast('El enlace del preset no es válido.', 'error')
    }
    const next = new URLSearchParams(searchParams)
    next.delete('preset')
    setSearchParams(next, { replace: true })
  }, [applyState, searchParams, setSearchParams, toast])

  return (
    <div className="space-y-3">
      <PresetBar />

      <div className="flex items-center justify-between gap-2 xl:hidden">
        <div className="panel-flat flex flex-1 gap-1 p-1">
          {MOBILE_TABS.map((tab) => {
            const Icon = tab.icon
            const active = mobileTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setMobileTab(tab.id)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11.5px] font-medium transition ${
                  active ? 'bg-brand/15 text-brand-soft' : 'text-neutral-500'
                }`}
              >
                <Icon size={13} /> {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[264px_minmax(0,1fr)_330px]">
        <LibraryPanel
          className={`${mobileTab === 'library' ? 'flex' : 'hidden'} min-w-0 h-[68vh] xl:sticky xl:top-[72px] xl:flex xl:h-[calc(100dvh-190px)]`}
        />

        <div className={`${mobileTab === 'editor' ? 'block' : 'hidden'} min-w-0 space-y-3 xl:block`}>
          <AmpConsole />
          <SignalChain />
          <EqPanel />
        </div>

        <EffectsPanel
          className={`${mobileTab === 'effects' ? 'flex' : 'hidden'} min-w-0 max-h-[68vh] xl:sticky xl:top-[72px] xl:flex xl:max-h-[calc(100dvh-190px)]`}
        />
      </div>
    </div>
  )
}

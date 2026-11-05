import { ChevronDown, Layers, RotateCcw, Save, Share2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { usePresets } from '../context/PresetsContext'
import { useStudio } from '../context/StudioContext'
import { useToast } from '../context/ToastContext'
import { buildShareUrl } from '../lib/share'
import { formatDate } from '../lib/format'
import { SavePresetDialog, SharePresetDialog } from './PresetDialogs'
import { PresetMiniEq } from './PresetMiniEq'

export function PresetBar() {
  const { state, presetLabel, isDirty, applyPreset, reset } = useStudio()
  const { presets, factoryPresets, save } = usePresets()
  const { toast } = useToast()

  const [menuOpen, setMenuOpen] = useState(false)
  const [saveOpen, setSaveOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [menuOpen])

  const load = (presetId: string, builtin: boolean) => {
    const preset = builtin
      ? factoryPresets.find((item) => item.id === presetId)
      : presets.find((item) => item.id === presetId)
    if (!preset) return
    applyPreset(preset)
    setMenuOpen(false)
    toast(`Preset “${preset.name}” cargado`)
  }

  const openShare = () => {
    setShareUrl(buildShareUrl(state))
    setShareOpen(true)
    setMenuOpen(false)
  }

  return (
    <>
      <div className="panel relative z-40 flex flex-wrap items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-brand/30 bg-brand/10 text-brand sm:flex">
            <Layers size={15} />
          </div>
          <div className="min-w-0">
            <p className="label-xs flex items-center gap-1.5">
              Preset actual
              {isDirty && <span className="h-1.5 w-1.5 rounded-full bg-brand" title="Cambios sin guardar" />}
            </p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <p className="truncate text-[13px] font-semibold text-white">{presetLabel}</p>
              <span className="hidden text-[10px] text-neutral-600 sm:block">
                {isDirty ? '· modificado' : '· sin cambios'}
              </span>
            </div>
          </div>
          <PresetMiniEq bands={state.bands} className="ml-1 hidden h-7 sm:flex" />
        </div>

        <div className="flex items-center gap-1.5">
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((value) => !value)}
              className="btn btn-ghost h-8 gap-1 px-2.5 py-1 text-[11.5px]"
              aria-haspopup="listbox"
              aria-expanded={menuOpen}
            >
              Cargar <ChevronDown size={13} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-10 z-50 max-h-[340px] w-[248px] animate-[rise_0.18s_ease-out] overflow-y-auto rounded-xl border border-white/10 bg-[#171717] p-1.5 shadow-[0_28px_60px_-24px_rgba(0,0,0,0.95)]">
                <p className="label-xs px-2 py-1.5">De fábrica</p>
                {factoryPresets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => load(preset.id, true)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-white/5"
                  >
                    <PresetMiniEq bands={preset.state.bands} className="h-5 w-10 shrink-0" />
                    <span className="min-w-0 flex-1 truncate text-[11.5px] text-neutral-300">{preset.name}</span>
                  </button>
                ))}

                <p className="label-xs mt-1 border-t border-white/8 px-2 pb-1.5 pt-2">
                  Tus presets {presets.length > 0 && `· ${presets.length}`}
                </p>
                {presets.length === 0 ? (
                  <p className="px-2 pb-2 text-[10.5px] leading-relaxed text-neutral-600">
                    Aún no has guardado ninguno.
                  </p>
                ) : (
                  presets.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => load(preset.id, false)}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-white/5"
                    >
                      <PresetMiniEq bands={preset.state.bands} className="h-5 w-10 shrink-0" />
                      <span className="min-w-0 flex-1 truncate text-[11.5px] text-neutral-300">{preset.name}</span>
                      <span className="num shrink-0 text-[9px] text-neutral-600">{formatDate(preset.createdAt)}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => setSaveOpen(true)}
            className="btn btn-ghost h-8 gap-1 px-2.5 py-1 text-[11.5px]"
            title="Guardar preset"
          >
            <Save size={13} />
            <span className="hidden sm:inline">Guardar</span>
          </button>

          <button
            onClick={openShare}
            className="btn btn-ghost h-8 gap-1 px-2.5 py-1 text-[11.5px]"
            title="Compartir preset"
          >
            <Share2 size={13} />
            <span className="hidden sm:inline">Compartir</span>
          </button>

          <button
            onClick={() => {
              reset()
              toast('Estudio restablecido', 'info')
            }}
            className="icon-btn h-8 w-8"
            title="Restablecer"
            aria-label="Restablecer estudio"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      <SavePresetDialog
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        defaultName={presetLabel}
        onSave={async (name) => {
          await save(name, state)
        }}
      />

      <SharePresetDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        url={shareUrl}
        presetName={presetLabel}
      />
    </>
  )
}

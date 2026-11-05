import { Layers, Save, Share2, SlidersHorizontal, Sparkles, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { PresetMiniEq } from '../components/PresetMiniEq'
import { SavePresetDialog, SharePresetDialog } from '../components/PresetDialogs'
import { usePresets } from '../context/PresetsContext'
import { useStudio } from '../context/StudioContext'
import { useToast } from '../context/ToastContext'
import { formatDate } from '../lib/format'
import type { Preset } from '../lib/presets'
import { buildShareUrl } from '../lib/share'
import { activeEffects, EFFECT_META } from '../lib/studio'

export function PresetsPage() {
  const { presets, factoryPresets, loading, save, remove } = usePresets()
  const { state, presetLabel, applyPreset } = useStudio()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [saveOpen, setSaveOpen] = useState(false)
  const [share, setShare] = useState<{ url: string; name: string } | null>(null)

  const load = (preset: Preset) => {
    applyPreset(preset)
    toast(`Preset “${preset.name}” cargado`)
    navigate('/studio')
  }

  return (
    <div className="space-y-4">
      <section className="panel relative overflow-hidden px-4 py-5 sm:px-6">
        <div className="pointer-events-none absolute -right-12 -top-20 h-56 w-56 rounded-full bg-brand/[0.12] blur-[90px]" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="label-xs flex items-center gap-1.5 text-brand">
              <Layers size={11} /> Configuraciones
            </p>
            <h1 className="mt-2 text-[24px] font-semibold tracking-[-0.02em] text-white">Presets</h1>
            <p className="mt-1 max-w-lg text-[12.5px] text-neutral-400">
              Guarda tu cadena completa —EQ, tono, efectos y velocidad— y recupérala cuando quieras.
            </p>
          </div>
          <button onClick={() => setSaveOpen(true)} className="btn btn-primary text-[12px]">
            <Save size={13} /> Guardar estado actual
          </button>
        </div>
      </section>

      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-300">
            Tus presets
          </h2>
          <span className="num text-[10px] text-neutral-500">{presets.length} guardados</span>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="skeleton h-16 rounded-xl" />
            ))}
          </div>
        ) : presets.length === 0 ? (
          <EmptyState
            icon={SlidersHorizontal}
            title="Aún no has guardado presets"
            description="Ajusta el ecualizador y los efectos en el studio, pulsa Guardar y aparecerán aquí."
            action={
              <button onClick={() => setSaveOpen(true)} className="btn btn-primary text-[12px]">
                <Save size={13} /> Guardar “{presetLabel}”
              </button>
            }
          />
        ) : (
          <div className="space-y-2">
            {presets.map((preset) => {
              const effects = activeEffects(preset.state.effects)
              return (
                <div
                  key={preset.id}
                  className="panel flex flex-wrap items-center gap-3 px-3.5 py-3 transition hover:border-white/12"
                >
                  <PresetMiniEq bands={preset.state.bands} className="h-8 w-14 shrink-0" />

                  <div className="min-w-[150px] flex-1">
                    <p className="truncate text-[12.5px] font-semibold text-neutral-100">{preset.name}</p>
                    <p className="mt-0.5 text-[10px] text-neutral-500">
                      {formatDate(preset.createdAt)} · {Math.round(preset.state.speed * 100)}% velocidad
                    </p>
                  </div>

                  <div className="hidden flex-wrap gap-1 md:flex">
                    {effects.slice(0, 3).map((id) => (
                      <span key={id} className="chip text-[9.5px]">
                        {EFFECT_META[id].label}
                      </span>
                    ))}
                    {effects.length > 3 && (
                      <span className="chip text-[9.5px]">+{effects.length - 3}</span>
                    )}
                    {effects.length === 0 && (
                      <span className="text-[10px] text-neutral-600">Solo EQ</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button onClick={() => load(preset)} className="btn btn-ghost h-8 px-2.5 text-[11.5px]">
                      <SlidersHorizontal size={12} /> Cargar
                    </button>
                    <button
                      onClick={() => setShare({ url: buildShareUrl(preset.state), name: preset.name })}
                      className="icon-btn h-8 w-8"
                      aria-label={`Compartir ${preset.name}`}
                    >
                      <Share2 size={13} />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`¿Eliminar el preset “${preset.name}”?`)) void remove(preset.id)
                      }}
                      className="icon-btn h-8 w-8 hover:text-red-400"
                      aria-label={`Eliminar ${preset.name}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="space-y-2.5">
        <div className="flex items-center gap-2 px-1">
          <Sparkles size={13} className="text-brand" />
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-300">
            Presets de fábrica
          </h2>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          {factoryPresets.map((preset) => (
            <article key={preset.id} className="panel flex flex-col gap-2.5 p-3.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[12.5px] font-semibold text-neutral-100">{preset.name}</p>
                  <p className="mt-0.5 text-[10.5px] leading-snug text-neutral-500">{preset.description}</p>
                </div>
                <PresetMiniEq bands={preset.state.bands} className="h-8 w-12 shrink-0" />
              </div>

              <div className="flex flex-wrap gap-1">
                {activeEffects(preset.state.effects).slice(0, 2).map((id) => (
                  <span key={id} className="chip text-[9px]">
                    {EFFECT_META[id].label}
                  </span>
                ))}
                {activeEffects(preset.state.effects).length === 0 && (
                  <span className="text-[9.5px] text-neutral-600">Sin efectos</span>
                )}
              </div>

              <div className="mt-auto flex items-center gap-1.5 pt-1">
                <button onClick={() => load(preset)} className="btn btn-ghost h-7 flex-1 px-2 text-[11px]">
                  Probar
                </button>
                <button
                  onClick={() => setShare({ url: buildShareUrl(preset.state), name: preset.name })}
                  className="icon-btn h-7 w-7"
                  aria-label={`Compartir ${preset.name}`}
                >
                  <Share2 size={12} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <SavePresetDialog
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        defaultName={presetLabel}
        onSave={async (name) => {
          await save(name, state)
        }}
      />

      <SharePresetDialog
        open={Boolean(share)}
        onClose={() => setShare(null)}
        url={share?.url ?? ''}
        presetName={share?.name ?? ''}
      />
    </div>
  )
}

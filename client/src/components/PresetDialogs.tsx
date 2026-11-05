import { Copy, Link2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { copyToClipboard } from '../lib/share'
import { Modal } from './Modal'

interface SavePresetDialogProps {
  open: boolean
  onClose: () => void
  defaultName: string
  onSave: (name: string) => Promise<unknown> | void
}

export function SavePresetDialog({ open, onClose, defaultName, onSave }: SavePresetDialogProps) {
  const [name, setName] = useState(defaultName)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) setName(defaultName === 'Flat Studio' || defaultName === 'Personalizado' ? 'Mi preset' : `${defaultName} · edit`)
  }, [open, defaultName])

  const submit = async () => {
    if (!name.trim() || busy) return
    setBusy(true)
    try {
      await onSave(name.trim())
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Guardar preset"
      description="Se guardarán el EQ, el tono, los efectos y la velocidad actuales en tu cuenta."
      footer={
        <>
          <button onClick={onClose} className="btn btn-ghost">
            Cancelar
          </button>
          <button onClick={() => void submit()} disabled={!name.trim() || busy} className="btn btn-primary">
            {busy ? 'Guardando…' : 'Guardar preset'}
          </button>
        </>
      }
    >
      <label className="label-xs" htmlFor="preset-name">
        Nombre del preset
      </label>
      <input
        id="preset-name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') void submit()
        }}
        maxLength={48}
        autoFocus
        className="input mt-2"
        placeholder="Ej. Bajos de club"
      />
      <p className="mt-2 text-[11px] text-neutral-500">
        Podrás cargarlo desde el studio o desde la pantalla de presets.
      </p>
    </Modal>
  )
}

interface SharePresetDialogProps {
  open: boolean
  onClose: () => void
  url: string
  presetName: string
}

export function SharePresetDialog({ open, onClose, url, presetName }: SharePresetDialogProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) setCopied(false)
  }, [open])

  const copy = async () => {
    const ok = await copyToClipboard(url)
    setCopied(ok)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Compartir preset"
      description={`“${presetName}” viaja dentro del enlace: quien lo abra tendrá exactamente tu cadena de audio.`}
      footer={
        <>
          <button onClick={onClose} className="btn btn-ghost">
            Cerrar
          </button>
          <button onClick={() => void copy()} className="btn btn-primary">
            <Copy size={13} /> {copied ? '¡Copiado!' : 'Copiar enlace'}
          </button>
        </>
      }
    >
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-2.5">
        <Link2 size={14} className="shrink-0 text-brand" />
        <input
          readOnly
          value={url}
          onFocus={(event) => event.currentTarget.select()}
          className="num w-full truncate bg-transparent text-[11px] text-neutral-300 outline-none"
          aria-label="Enlace para compartir"
        />
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">
        El enlace contiene el estado del estudio codificado; no necesita servidor ni base de datos.
      </p>
    </Modal>
  )
}

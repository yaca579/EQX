import { FileAudio, Loader2, UploadCloud } from 'lucide-react'
import { useRef, useState, type DragEvent } from 'react'
import { useLocalTracks } from '../context/LocalTracksContext'
import { ACCEPTED_AUDIO } from '../services/localAudio'

interface UploadTracksProps {
  variant?: 'panel' | 'hero'
  className?: string
}

export function UploadTracks({ variant = 'panel', className = '' }: UploadTracksProps) {
  const { addFiles, uploading } = useLocalTracks()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [dragging, setDragging] = useState(false)

  const drop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    if (event.dataTransfer.files?.length) void addFiles(event.dataTransfer.files)
  }

  const dragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(true)
  }

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept={ACCEPTED_AUDIO}
      multiple
      className="hidden"
      aria-label="Subir archivos de audio"
      onChange={(event) => {
        if (event.target.files?.length) void addFiles(event.target.files)
        event.target.value = ''
      }}
    />
  )

  if (variant === 'hero') {
    return (
      <div
        onDragOver={dragOver}
        onDragLeave={() => setDragging(false)}
        onDrop={drop}
        className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed px-4 py-7 text-center transition ${
          dragging ? 'border-brand/60 bg-brand/[0.07]' : 'border-white/12 bg-white/[0.015]'
        } ${className}`}
      >
        {fileInput}
        <span className="mb-1 flex h-9 w-9 items-center justify-center rounded-full border border-brand/30 bg-brand/10 text-brand">
          {uploading ? <Loader2 size={15} className="animate-spin" /> : <FileAudio size={15} />}
        </span>
        <p className="text-[12.5px] font-medium text-neutral-200">Arrastra aquí tus MP3 o WAV</p>
        <p className="text-[10.5px] leading-relaxed text-neutral-500">
          Se guardan sólo en este dispositivo · hasta 80 MB por archivo
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="btn btn-primary mt-1.5 h-8 text-[11.5px]"
        >
          {uploading ? <Loader2 size={13} className="animate-spin" /> : <UploadCloud size={13} />}
          {uploading ? 'Procesando…' : 'Elegir archivos'}
        </button>
      </div>
    )
  }

  return (
    <div
      onDragOver={dragOver}
      onDragLeave={() => setDragging(false)}
      onDrop={drop}
      className={`flex flex-wrap items-center gap-2 ${className}`}
    >
      {fileInput}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={`btn btn-ghost h-8 text-[11.5px] ${dragging ? 'border-brand/50 text-brand-soft' : ''}`}
      >
        {uploading ? <Loader2 size={12} className="animate-spin" /> : <UploadCloud size={12} />}
        {uploading ? 'Procesando…' : 'Subir audio'}
      </button>
      <span className="text-[10px] text-neutral-600">MP3 · WAV · máx. 80 MB</span>
    </div>
  )
}

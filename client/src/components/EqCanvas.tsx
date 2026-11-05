import { useEffect, useRef } from 'react'
import { getEngine } from '../audio/engine'
import {
  clamp,
  EQ_BAND_LABELS,
  EQ_FREQUENCIES,
  EQ_MAX_DB,
  EQ_MIN_DB,
  formatDb,
} from '../lib/studio'

interface EqCanvasProps {
  bands: number[]
  onChange: (index: number, gain: number) => void
  height?: number
}

const F_MIN = 20
const F_MAX = 20000
const PAD = { top: 14, right: 16, bottom: 24, left: 36 }

export function EqCanvas({ bands, onChange, height = 300 }: EqCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const bandsRef = useRef(bands)
  const dragRef = useRef<number | null>(null)
  const hoverRef = useRef<number | null>(null)
  const sizeRef = useRef({ width: 0, height: 0 })
  const curveRef = useRef<Float32Array | null>(null)
  const magnitudeRef = useRef<Float32Array | null>(null)
  const freqsRef = useRef<Float32Array | null>(null)

  bandsRef.current = bands

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const resize = () => {
      const width = Math.max(1, container.clientWidth)
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      // El backing store cambia, el tamaño CSS lo controla el contenedor
      // (escribir style.width aquí realimenta el ancho del grid).
      canvas.width = Math.max(1, Math.floor(width * dpr))
      canvas.height = Math.max(1, Math.floor(height * dpr))
      sizeRef.current = { width, height }
      const plotWidth = Math.max(10, width - PAD.left - PAD.right)
      const count = Math.min(360, Math.max(90, Math.floor(plotWidth)))
      if (!curveRef.current || curveRef.current.length !== count) {
        curveRef.current = new Float32Array(count)
        magnitudeRef.current = new Float32Array(count)
        const freqs = new Float32Array(count)
        for (let i = 0; i < count; i += 1) {
          freqs[i] = F_MIN * Math.pow(F_MAX / F_MIN, i / (count - 1))
        }
        freqsRef.current = freqs
        curveRef.current.fill(0)
      }
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(container)

    let frame = 0
    let disposed = false

    const render = () => {
      if (disposed) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      draw(ctx, canvas, bandsRef.current, {
        drag: dragRef.current,
        hover: hoverRef.current,
        curve: curveRef.current,
        magnitude: magnitudeRef.current,
        freqs: freqsRef.current,
        engine: getEngine(),
      })
      frame = requestAnimationFrame(render)
    }
    frame = requestAnimationFrame(render)

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [height])

  const pointToValue = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0, gain: 0 }
    const rect = canvas.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top
    const plotHeight = rect.height - PAD.top - PAD.bottom
    const ratio = clamp((y - PAD.top) / plotHeight, 0, 1)
    const gain = EQ_MAX_DB - ratio * (EQ_MAX_DB - EQ_MIN_DB)
    return { x, y, gain }
  }

  const freqToPlotX = (frequency: number, width: number) => {
    const ratio = Math.log(frequency / F_MIN) / Math.log(F_MAX / F_MIN)
    return PAD.left + ratio * (width - PAD.left - PAD.right)
  }

  const findBand = (x: number) => {
    const width = sizeRef.current.width
    let best = -1
    let bestDistance = Infinity
    EQ_FREQUENCIES.forEach((frequency, index) => {
      const distance = Math.abs(freqToPlotX(frequency, width) - x)
      if (distance < bestDistance) {
        bestDistance = distance
        best = index
      }
    })
    return bestDistance <= 34 ? best : -1
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      /* punteros sintéticos o ya liberados */
    }
    const { x, y, gain } = pointToValue(event.clientX, event.clientY)
    const band = findBand(x)
    if (band === -1) return
    dragRef.current = band
    hoverRef.current = band
    onChange(band, gain)
    void y
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y, gain } = pointToValue(event.clientX, event.clientY)
    if (dragRef.current !== null) {
      onChange(dragRef.current, Number(gain.toFixed(1)))
      return
    }
    const band = findBand(x)
    hoverRef.current = band === -1 ? null : band
    const canvas = canvasRef.current
    if (canvas) {
      canvas.style.cursor = band === -1 ? 'crosshair' : 'ns-resize'
    }
    void y
  }

  const endInteraction = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    dragRef.current = null
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endInteraction}
        onPointerCancel={endInteraction}
        onPointerLeave={() => {
          if (dragRef.current === null) hoverRef.current = null
        }}
        onDoubleClick={(event) => {
          const { x } = pointToValue(event.clientX, event.clientY)
          const band = findBand(x)
          if (band !== -1) onChange(band, 0)
        }}
        className="block w-full touch-none rounded-xl"
        style={{ height }}
        role="img"
        aria-label="Ecualizador gráfico editable. Arrastra los puntos para ajustar cada banda."
      />
    </div>
  )
}

interface DrawOptions {
  drag: number | null
  hover: number | null
  curve: Float32Array | null
  magnitude: Float32Array | null
  freqs: Float32Array | null
  engine: ReturnType<typeof getEngine>
}

function draw(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  bands: number[],
  options: DrawOptions,
) {
  const dpr = canvas.width / Math.max(1, canvas.clientWidth)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  const width = canvas.clientWidth
  const height = canvas.clientHeight
  ctx.clearRect(0, 0, width, height)

  const x0 = PAD.left
  const y0 = PAD.top
  const plotWidth = width - PAD.left - PAD.right
  const plotHeight = height - PAD.top - PAD.bottom

  const freqToX = (frequency: number) => x0 + (Math.log(frequency / F_MIN) / Math.log(F_MAX / F_MIN)) * plotWidth
  const dbToY = (db: number) => y0 + ((EQ_MAX_DB - db) / (EQ_MAX_DB - EQ_MIN_DB)) * plotHeight

  // Fondo
  const background = ctx.createLinearGradient(0, y0, 0, y0 + plotHeight)
  background.addColorStop(0, 'rgba(255,106,0,0.045)')
  background.addColorStop(0.55, 'rgba(255,255,255,0.012)')
  background.addColorStop(1, 'rgba(0,0,0,0.25)')
  ctx.fillStyle = background
  ctx.fillRect(x0, y0, plotWidth, plotHeight)

  // Rejilla vertical (frecuencias)
  const gridFreqs = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000]
  ctx.font = '500 9.5px "JetBrains Mono Variable", ui-monospace, monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  gridFreqs.forEach((frequency, index) => {
    const x = freqToX(frequency)
    ctx.beginPath()
    ctx.strokeStyle = 'rgba(255,255,255,0.055)'
    ctx.lineWidth = 1
    ctx.moveTo(Math.round(x) + 0.5, y0)
    ctx.lineTo(Math.round(x) + 0.5, y0 + plotHeight)
    ctx.stroke()
    ctx.fillStyle = 'rgba(255,255,255,0.34)'
    ctx.fillText(EQ_BAND_LABELS[index], x, y0 + plotHeight + 7)
  })

  // Rejilla horizontal (dB)
  ;[-18, -12, -6, 0, 6, 12, 18].forEach((db) => {
    const y = dbToY(db)
    ctx.beginPath()
    ctx.strokeStyle = db === 0 ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.05)'
    ctx.lineWidth = 1
    ctx.moveTo(x0, Math.round(y) + 0.5)
    ctx.lineTo(x0 + plotWidth, Math.round(y) + 0.5)
    ctx.stroke()
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = db === 0 ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.26)'
    ctx.fillText(db === 0 ? '0' : `${db > 0 ? '+' : ''}${db}`, x0 - 8, y)
  })

  // Espectro en vivo de fondo
  const data = options.engine.getFrequencyData()
  if (data && options.freqs) {
    const sampleRate = options.engine.sampleRate
    const binCount = data.length
    ctx.beginPath()
    ctx.moveTo(x0, y0 + plotHeight)
    const steps = 140
    for (let s = 0; s <= steps; s += 1) {
      const ratio = s / steps
      const frequency = F_MIN * Math.pow(F_MAX / F_MIN, ratio)
      const bin = Math.min(binCount - 1, Math.round((frequency / (sampleRate / 2)) * binCount))
      const value = data[bin] / 255
      const amplitude = Math.pow(value, 1.6)
      const x = x0 + ratio * plotWidth
      const y = y0 + plotHeight - amplitude * plotHeight * 0.86
      ctx.lineTo(x, y)
    }
    ctx.lineTo(x0 + plotWidth, y0 + plotHeight)
    ctx.closePath()
    const spectrumFill = ctx.createLinearGradient(0, y0, 0, y0 + plotHeight)
    spectrumFill.addColorStop(0, 'rgba(255,138,61,0.20)')
    spectrumFill.addColorStop(0.6, 'rgba(255,106,0,0.10)')
    spectrumFill.addColorStop(1, 'rgba(255,106,0,0.02)')
    ctx.fillStyle = spectrumFill
    ctx.fill()
  }

  // Curva del EQ
  let curve: Float32Array | null = options.curve
  const magnitude = options.magnitude
  if (curve && magnitude && options.freqs) {
    if (options.engine.getEqMagnitude(options.freqs, magnitude)) {
      for (let i = 0; i < curve.length; i += 1) {
        curve[i] = 20 * Math.log10(Math.max(0.0001, magnitude[i]))
      }
    } else {
      curve.fill(0)
    }
  }

  if (curve) {
    const curvePath = new Path2D()
    const baseY = y0 + plotHeight
    curvePath.moveTo(x0, baseY)
    for (let i = 0; i < curve.length; i += 1) {
      const ratio = i / (curve.length - 1)
      const x = x0 + ratio * plotWidth
      const y = clamp(dbToY(clamp(curve[i], EQ_MIN_DB, EQ_MAX_DB)), y0, baseY)
      curvePath.lineTo(x, y)
    }
    curvePath.lineTo(x0 + plotWidth, baseY)
    curvePath.closePath()

    const fill = ctx.createLinearGradient(0, y0, 0, baseY)
    fill.addColorStop(0, 'rgba(255,106,0,0.28)')
    fill.addColorStop(0.7, 'rgba(255,106,0,0.08)')
    fill.addColorStop(1, 'rgba(255,106,0,0.01)')
    ctx.fillStyle = fill
    ctx.fill(curvePath)

    const strokePath = new Path2D()
    for (let i = 0; i < curve.length; i += 1) {
      const ratio = i / (curve.length - 1)
      const x = x0 + ratio * plotWidth
      const y = clamp(dbToY(clamp(curve[i], EQ_MIN_DB, EQ_MAX_DB)), y0, baseY)
      if (i === 0) strokePath.moveTo(x, y)
      else strokePath.lineTo(x, y)
    }
    ctx.save()
    ctx.strokeStyle = '#FF6A00'
    ctx.lineWidth = 2.2
    ctx.lineJoin = 'round'
    ctx.shadowColor = 'rgba(255,106,0,0.75)'
    ctx.shadowBlur = 12
    ctx.stroke(strokePath)
    ctx.restore()
  }

  // Puntos editables
  EQ_FREQUENCIES.forEach((frequency, index) => {
    const x = freqToX(frequency)
    const y = dbToY(clamp(bands[index] ?? 0, EQ_MIN_DB, EQ_MAX_DB))
    const active = options.drag === index
    const hovered = options.hover === index
    const radius = active ? 7 : hovered ? 6 : 4.6

    if (active || hovered) {
      ctx.beginPath()
      ctx.arc(x, y, radius + 7, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,106,0,0.12)'
      ctx.fill()

      ctx.beginPath()
      ctx.setLineDash([3, 3])
      ctx.strokeStyle = 'rgba(255,106,0,0.32)'
      ctx.lineWidth = 1
      ctx.moveTo(x, y0)
      ctx.lineTo(x, y0 + plotHeight)
      ctx.stroke()
      ctx.setLineDash([])
    }

    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fillStyle = active ? '#FF8A3D' : '#121212'
    ctx.fill()
    ctx.strokeStyle = '#FF6A00'
    ctx.lineWidth = 1.8
    ctx.stroke()

    if (active) {
      ctx.beginPath()
      ctx.arc(x, y, 2, 0, Math.PI * 2)
      ctx.fillStyle = '#0F0F0F'
      ctx.fill()
    }
  })

  // Etiqueta flotante
  const focus = options.drag ?? options.hover
  if (focus !== null) {
    const frequency = EQ_FREQUENCIES[focus]
    const gain = bands[focus] ?? 0
    const x = freqToX(frequency)
    const y = dbToY(clamp(gain, EQ_MIN_DB, EQ_MAX_DB))
    const label = `${EQ_BAND_LABELS[focus]} Hz · ${formatDb(gain)} dB`
    ctx.font = '500 10.5px "JetBrains Mono Variable", ui-monospace, monospace'
    const textWidth = ctx.measureText(label).width
    const boxWidth = textWidth + 18
    const boxHeight = 24
    let boxX = x - boxWidth / 2
    boxX = clamp(boxX, x0, x0 + plotWidth - boxWidth)
    let boxY = y - boxHeight - 14
    if (boxY < y0 + 2) boxY = y + 16

    ctx.beginPath()
    ctx.roundRect?.(boxX, boxY, boxWidth, boxHeight, 7)
    if (!ctx.roundRect) ctx.rect(boxX, boxY, boxWidth, boxHeight)
    ctx.fillStyle = 'rgba(20,20,20,0.96)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,106,0,0.35)'
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.fillStyle = '#FFB687'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(label, boxX + boxWidth / 2, boxY + boxHeight / 2 + 0.5)
  }

  // Etiqueta de eje
  ctx.font = '500 8.5px "JetBrains Mono Variable", ui-monospace, monospace'
  ctx.fillStyle = 'rgba(255,255,255,0.22)'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'bottom'
  ctx.fillText('dB', 6, y0 + 2)
}

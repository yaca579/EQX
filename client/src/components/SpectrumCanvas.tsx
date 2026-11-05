import { useEffect, useRef } from 'react'
import { getEngine } from '../audio/engine'

interface SpectrumCanvasProps {
  height?: number
  className?: string
  idleLabel?: string
}

const BARS = 76

export function SpectrumCanvas({ height = 150, className = '', idleLabel = 'Sin señal' }: SpectrumCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const peaks = new Float32Array(BARS)
    const smoothed = new Float32Array(BARS)
    let frame = 0
    let disposed = false

    const resize = () => {
      const width = Math.max(1, container.clientWidth)
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      // Sólo cambia el backing store: el CSS lo define el contenedor.
      canvas.width = Math.max(1, Math.floor(width * dpr))
      canvas.height = Math.max(1, Math.floor(height * dpr))
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(container)

    const engine = getEngine()

    const render = (timestamp: number) => {
      if (disposed) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const dpr = canvas.width / Math.max(1, canvas.clientWidth)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const width = canvas.clientWidth
      const h = canvas.clientHeight
      ctx.clearRect(0, 0, width, h)

      const data = engine.getFrequencyData()
      const sampleRate = engine.sampleRate
      const binCount = data?.length ?? 0
      const gap = 2
      const barWidth = (width - gap * (BARS - 1)) / BARS
      const idle = !data || data.every((value) => value === 0)

      // líneas guía
      ctx.strokeStyle = 'rgba(255,255,255,0.045)'
      ctx.lineWidth = 1
      for (let line = 1; line < 4; line += 1) {
        const y = Math.round((h / 4) * line) + 0.5
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }

      for (let i = 0; i < BARS; i += 1) {
        const ratio = i / (BARS - 1)
        let level = 0

        if (!idle && data) {
          const fMin = 30
          const fMax = 16000
          const from = fMin * Math.pow(fMax / fMin, ratio)
          const to = fMin * Math.pow(fMax / fMin, (i + 1) / (BARS - 1))
          const binFrom = Math.max(0, Math.floor((from / (sampleRate / 2)) * binCount))
          const binTo = Math.max(binFrom + 1, Math.ceil((to / (sampleRate / 2)) * binCount))
          let sum = 0
          let count = 0
          for (let bin = binFrom; bin < Math.min(binTo, binCount); bin += 1) {
            sum += data[bin]
            count += 1
          }
          const average = count ? sum / count : 0
          level = Math.pow(average / 255, 1.25) * 1.15
          // curva de realce de graves/agudos para un look más musical
          level *= 0.85 + Math.sin(ratio * Math.PI) * 0.3
        } else {
          const wave = Math.sin(timestamp / 620 + ratio * 7) * 0.5 + 0.5
          level = 0.045 + wave * 0.05
        }

        level = Math.min(1, Math.max(0.012, level))
        smoothed[i] = smoothed[i] * 0.62 + level * 0.38
        peaks[i] = Math.max(peaks[i] * 0.955, smoothed[i])

        const barHeight = Math.max(2, smoothed[i] * (h - 12))
        const x = i * (barWidth + gap)
        const y = h - barHeight

        const gradient = ctx.createLinearGradient(0, h, 0, h - barHeight)
        gradient.addColorStop(0, 'rgba(255,106,0,0.42)')
        gradient.addColorStop(0.55, '#FF6A00')
        gradient.addColorStop(1, '#FFC08A')

        ctx.fillStyle = gradient
        ctx.beginPath()
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(x, y, barWidth, barHeight, Math.min(2, barWidth / 2))
        } else {
          ctx.rect(x, y, barWidth, barHeight)
        }
        ctx.fill()

        if (peaks[i] > 0.03 && !idle) {
          const peakY = h - Math.min(h - 6, peaks[i] * (h - 12))
          ctx.fillStyle = 'rgba(255,214,180,0.85)'
          ctx.fillRect(x, peakY - 2, barWidth, 1.6)
        }
      }

      if (idle) {
        ctx.font = '600 9px "JetBrains Mono Variable", ui-monospace, monospace'
        ctx.fillStyle = 'rgba(255,255,255,0.24)'
        ctx.textAlign = 'center'
        ctx.fillText(idleLabel.toUpperCase(), width / 2, h / 2)
      }

      frame = requestAnimationFrame(render)
    }

    frame = requestAnimationFrame(render)

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [height, idleLabel])

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <canvas ref={canvasRef} className="block w-full" style={{ height }} aria-hidden />
    </div>
  )
}

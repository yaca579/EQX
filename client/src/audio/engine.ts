import {
  clamp,
  effectiveTempo,
  EQ_FREQUENCIES,
  type EffectId,
  type StudioState,
} from '../lib/studio'
import {
  createImpulseResponse,
  createNoiseBuffer,
  makeDistortionCurve,
  makeSoftenCurve,
} from './textures'

const EFFECT_CHAIN: EffectId[] = [
  'bassBoost',
  'superBass',
  'vocalBoost',
  'distortion',
  'lofi',
  'vinyl',
  'reverb',
  'slowReverb',
  'eightD',
]

type MixConfig = { dry: number; wet: number; wetFromAmount: boolean }

const MIX: Record<string, MixConfig> = {
  bassBoost: { dry: 0, wet: 1, wetFromAmount: false },
  superBass: { dry: 0, wet: 1, wetFromAmount: false },
  vocalBoost: { dry: 0, wet: 1, wetFromAmount: false },
  distortion: { dry: 0.55, wet: 1, wetFromAmount: false },
  lofi: { dry: 0, wet: 1, wetFromAmount: false },
  vinyl: { dry: 1, wet: 1, wetFromAmount: false },
  reverb: { dry: 1, wet: 0.95, wetFromAmount: true },
  slowReverb: { dry: 1, wet: 0.62, wetFromAmount: false },
  eightD: { dry: 0, wet: 1, wetFromAmount: false },
}

type Slot = {
  input: GainNode
  output: GainNode
  dry: GainNode
  wet: GainNode
  setAmount: (amount: number) => void
  config: MixConfig
}

const SMOOTH = 0.02

export class AudioEngine {
  private ctx: AudioContext | null = null
  private el: HTMLAudioElement | null = null
  private source: MediaElementAudioSourceNode | null = null

  private eqInput: GainNode | null = null
  private bandFilters: BiquadFilterNode[] = []
  private toneFilters: Record<'bass' | 'mid' | 'treble', BiquadFilterNode> | null = null
  private slots: Partial<Record<EffectId, Slot>> = {}

  private master: GainNode | null = null
  private balance: StereoPannerNode | null = null
  private volumeNode: GainNode | null = null
  private analyser: AnalyserNode | null = null
  private limiter: DynamicsCompressorNode | null = null

  private frequencyData: Uint8Array<ArrayBuffer> | null = null
  private waveformData: Uint8Array<ArrayBuffer> | null = null
  private currentVolume = 0.85

  attach(el: HTMLAudioElement) {
    if (this.el === el) return
    if (this.source) {
      try {
        this.source.disconnect()
      } catch {
        /* el elemento anterior ya no existe */
      }
      this.source = null
    }
    this.el = el
    ;(el as HTMLAudioElement & { preservesPitch?: boolean }).preservesPitch = false
    if (this.ctx) this.build()
    this.unlock()
  }

  /** Crea el contexto y el grafo la primera vez que hace falta. */
  private ensure(): AudioContext | null {
    if (!this.el) return null
    if (this.ctx) return this.ctx

    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null

    const ctx = new Ctor({ latencyHint: 'interactive' })
    this.ctx = ctx
    this.build()
    this.unlock()
    return ctx
  }

  private unlock() {
    const resume = () => {
      if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume()
    }
    resume()
    if (typeof window !== 'undefined' && !this.unlockBound) {
      this.unlockBound = true
      window.addEventListener('pointerdown', resume, { passive: true })
      window.addEventListener('keydown', resume)
    }
  }

  private unlockBound = false

  private build() {
    const ctx = this.ctx
    const el = this.el
    if (!ctx || !el || this.source) return

    // Fuente del elemento <audio>
    this.source = ctx.createMediaElementSource(el)

    this.eqInput = ctx.createGain()
    this.eqInput.gain.value = 1

    const bass = ctx.createBiquadFilter()
    bass.type = 'lowshelf'
    bass.frequency.value = 120
    bass.gain.value = 0

    const mid = ctx.createBiquadFilter()
    mid.type = 'peaking'
    mid.frequency.value = 1000
    mid.Q.value = 0.8
    mid.gain.value = 0

    const treble = ctx.createBiquadFilter()
    treble.type = 'highshelf'
    treble.frequency.value = 6200
    treble.gain.value = 0

    this.toneFilters = { bass, mid, treble }

    this.bandFilters = EQ_FREQUENCIES.map((frequency) => {
      const filter = ctx.createBiquadFilter()
      filter.type = 'peaking'
      filter.frequency.value = frequency
      filter.Q.value = 1.1
      filter.gain.value = 0
      return filter
    })

    this.master = ctx.createGain()
    this.master.gain.value = 1

    this.balance = ctx.createStereoPanner()
    this.balance.pan.value = 0

    this.volumeNode = ctx.createGain()
    this.volumeNode.gain.value = volumeCurve(this.currentVolume)

    this.analyser = ctx.createAnalyser()
    this.analyser.fftSize = 4096
    this.analyser.smoothingTimeConstant = 0.82
    this.analyser.minDecibels = -92
    this.analyser.maxDecibels = -12

    this.limiter = ctx.createDynamicsCompressor()
    this.limiter.threshold.value = -1.5
    this.limiter.knee.value = 0
    this.limiter.ratio.value = 20
    this.limiter.attack.value = 0.002
    this.limiter.release.value = 0.18

    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount)
    this.waveformData = new Uint8Array(this.analyser.fftSize)

    this.slots = {
      bassBoost: this.createSlot(0, 1, (input, dest) => {
        const shelf = ctx.createBiquadFilter()
        shelf.type = 'lowshelf'
        shelf.frequency.value = 115
        shelf.gain.value = 0
        input.connect(shelf)
        shelf.connect(dest)
        return (amount) => shelf.gain.setTargetAtTime(amount * 12, ctx.currentTime, SMOOTH)
      }),
      superBass: this.createSlot(0, 1, (input, dest) => {
        const shelf = ctx.createBiquadFilter()
        shelf.type = 'lowshelf'
        shelf.frequency.value = 78
        shelf.gain.value = 0
        const peak = ctx.createBiquadFilter()
        peak.type = 'peaking'
        peak.frequency.value = 52
        peak.Q.value = 1.2
        peak.gain.value = 0
        input.connect(shelf)
        shelf.connect(peak)
        peak.connect(dest)
        return (amount) => {
          shelf.gain.setTargetAtTime(amount * 15, ctx.currentTime, SMOOTH)
          peak.gain.setTargetAtTime(amount * 8, ctx.currentTime, SMOOTH)
        }
      }),
      vocalBoost: this.createSlot(0, 1, (input, dest) => {
        const highpass = ctx.createBiquadFilter()
        highpass.type = 'highpass'
        highpass.frequency.value = 130
        highpass.Q.value = 0.7
        const presence = ctx.createBiquadFilter()
        presence.type = 'peaking'
        presence.frequency.value = 2900
        presence.Q.value = 1.05
        presence.gain.value = 0
        const air = ctx.createBiquadFilter()
        air.type = 'highshelf'
        air.frequency.value = 9000
        air.gain.value = 0
        input.connect(highpass)
        highpass.connect(presence)
        presence.connect(air)
        air.connect(dest)
        return (amount) => {
          presence.gain.setTargetAtTime(2 + amount * 9, ctx.currentTime, SMOOTH)
          air.gain.setTargetAtTime(amount * 3, ctx.currentTime, SMOOTH)
          highpass.frequency.setTargetAtTime(90 + amount * 80, ctx.currentTime, SMOOTH)
        }
      }),
      distortion: this.createSlot(0.55, 1, (input, dest) => {
        const pre = ctx.createGain()
        pre.gain.value = 1
        input.connect(pre)
        const shaper = ctx.createWaveShaper()
        shaper.curve = makeDistortionCurve(0.35)
        shaper.oversample = '4x'
        const tone = ctx.createBiquadFilter()
        tone.type = 'lowpass'
        tone.frequency.value = 6800
        const post = ctx.createGain()
        post.gain.value = 0.9
        pre.connect(shaper)
        shaper.connect(tone)
        tone.connect(post)
        post.connect(dest)
        return (amount) => {
          const now = ctx.currentTime
          shaper.curve = makeDistortionCurve(amount)
          pre.gain.setTargetAtTime(1 + amount * 3.2, now, SMOOTH)
          post.gain.setTargetAtTime(1 / (1 + amount * 1.45), now, SMOOTH)
          tone.frequency.setTargetAtTime(7600 - amount * 3400, now, SMOOTH)
        }
      }),
      lofi: this.createSlot(0, 1, (input, dest) => {
        const lowpass = ctx.createBiquadFilter()
        lowpass.type = 'lowpass'
        lowpass.frequency.value = 4200
        lowpass.Q.value = 0.6
        input.connect(lowpass)
        const shaper = ctx.createWaveShaper()
        shaper.curve = makeSoftenCurve(0.5)
        shaper.oversample = '2x'
        const highpass = ctx.createBiquadFilter()
        highpass.type = 'highpass'
        highpass.frequency.value = 90
        const out = ctx.createGain()
        out.gain.value = 0.94
        lowpass.connect(shaper)
        shaper.connect(highpass)
        highpass.connect(out)
        out.connect(dest)
        return (amount) => {
          const now = ctx.currentTime
          lowpass.frequency.setTargetAtTime(5400 - amount * 3900, now, SMOOTH)
          shaper.curve = makeSoftenCurve(amount * 1.4)
        }
      }),
      vinyl: this.createSlot(1, 1, (_input, dest) => {
        const source = ctx.createBufferSource()
        source.buffer = createNoiseBuffer(ctx, 2.4)
        source.loop = true
        const highpass = ctx.createBiquadFilter()
        highpass.type = 'highpass'
        highpass.frequency.value = 720
        const lowpass = ctx.createBiquadFilter()
        lowpass.type = 'lowpass'
        lowpass.frequency.value = 7600
        const gain = ctx.createGain()
        gain.gain.value = 0
        source.connect(highpass)
        highpass.connect(lowpass)
        lowpass.connect(gain)
        gain.connect(dest)
        source.start()
        return (amount) => {
          gain.gain.setTargetAtTime(amount * 0.085, ctx.currentTime, 0.05)
        }
      }),
      reverb: this.createSlot(1, 0.95, (input, dest) => {
        const preDelay = ctx.createDelay(0.1)
        preDelay.delayTime.value = 0.018
        input.connect(preDelay)
        const convolver = ctx.createConvolver()
        convolver.buffer = createImpulseResponse(ctx, 3.2, 2.7)
        const damp = ctx.createBiquadFilter()
        damp.type = 'lowpass'
        damp.frequency.value = 6800
        const wetOut = ctx.createGain()
        wetOut.gain.value = 1
        preDelay.connect(convolver)
        convolver.connect(damp)
        damp.connect(wetOut)
        wetOut.connect(dest)
        return (amount) => {
          damp.frequency.setTargetAtTime(7600 - amount * 4200, ctx.currentTime, SMOOTH)
        }
      }),
      slowReverb: this.createSlot(1, 0.62, (input, dest) => {
        const preDelay = ctx.createDelay(0.2)
        preDelay.delayTime.value = 0.03
        input.connect(preDelay)
        const convolver = ctx.createConvolver()
        convolver.buffer = createImpulseResponse(ctx, 5.4, 2.1)
        const damp = ctx.createBiquadFilter()
        damp.type = 'lowpass'
        damp.frequency.value = 4200
        preDelay.connect(convolver)
        convolver.connect(damp)
        damp.connect(dest)
        return () => undefined
      }),
      eightD: this.createSlot(0, 1, (input, dest) => {
        const panner = ctx.createStereoPanner()
        const lfo = ctx.createOscillator()
        lfo.type = 'sine'
        lfo.frequency.value = 0.12
        const lfoDepth = ctx.createGain()
        lfoDepth.gain.value = 0.85
        const width = ctx.createGain()
        width.gain.value = 1
        input.connect(width)
        width.connect(panner)
        panner.connect(dest)
        lfo.connect(lfoDepth)
        lfoDepth.connect(panner.pan)
        lfo.start()
        return (amount) => {
          const now = ctx.currentTime
          lfoDepth.gain.setTargetAtTime(amount * 0.92, now, 0.08)
          lfo.frequency.setTargetAtTime(0.1 + amount * 0.08, now, 0.08)
          width.gain.setTargetAtTime(0.88 + amount * 0.12, now, 0.08)
        }
      }),
    }

    // ── Conexión de la cadena ──
    let node: AudioNode = this.eqInput
    this.source.connect(this.eqInput)

    for (const filter of [bass, mid, treble, ...this.bandFilters]) {
      node.connect(filter)
      node = filter
    }

    for (const id of EFFECT_CHAIN) {
      const slot = this.slots[id]
      if (!slot) continue
      node.connect(slot.input)
      node = slot.output
    }

    node.connect(this.master)
    this.master.connect(this.balance)
    this.balance.connect(this.volumeNode)
    this.volumeNode.connect(this.analyser)
    this.analyser.connect(this.limiter)
    this.limiter.connect(ctx.destination)
  }

  private createSlot(
    dryLevel: number,
    wetLevel: number,
    build: (input: GainNode, dest: GainNode) => (amount: number) => void,
  ): Slot {
    const ctx = this.ctx!
    const input = ctx.createGain()
    const output = ctx.createGain()
    const dry = ctx.createGain()
    const wet = ctx.createGain()
    dry.gain.value = 1
    wet.gain.value = 0
    input.connect(dry)
    dry.connect(output)
    wet.connect(output)
    const setAmount = build(input, wet)
    return {
      input,
      output,
      dry,
      wet,
      setAmount,
      config: { dry: dryLevel, wet: wetLevel, wetFromAmount: false },
    }
  }

  /** Aplica el estado completo del estudio de forma suave e idempotente. */
  applyState(state: StudioState) {
    const ctx = this.ensure()
    if (!ctx || !this.toneFilters || !this.master || !this.balance) return
    const now = ctx.currentTime

    this.toneFilters.bass.gain.setTargetAtTime(state.bass, now, SMOOTH)
    this.toneFilters.mid.gain.setTargetAtTime(state.mid, now, SMOOTH)
    this.toneFilters.treble.gain.setTargetAtTime(state.treble, now, SMOOTH)

    this.bandFilters.forEach((filter, index) => {
      filter.gain.setTargetAtTime(clamp(state.bands[index] ?? 0, -24, 24), now, SMOOTH)
    })

    const masterGain = Math.pow(10, state.gain / 20)
    this.master.gain.setTargetAtTime(masterGain, now, SMOOTH)
    this.balance.pan.setTargetAtTime(clamp(state.balance, -1, 1), now, SMOOTH)

    for (const id of EFFECT_CHAIN) {
      const slot = this.slots[id]
      if (!slot) continue
      const effect = state.effects[id]
      const mix = MIX[id]
      const enabled = Boolean(effect?.enabled)
      const amount = clamp(effect?.amount ?? 0, 0, 1)
      const wetTarget = enabled ? (mix.wetFromAmount ? mix.wet * amount : mix.wet) : 0
      const dryTarget = enabled ? mix.dry : 1
      slot.wet.gain.setTargetAtTime(wetTarget, now, 0.03)
      slot.dry.gain.setTargetAtTime(dryTarget, now, 0.03)
      slot.setAmount(amount)
    }

    if (this.el) {
      const tempo = effectiveTempo(state)
      if (Math.abs(this.el.playbackRate - tempo) > 0.0005) {
        this.el.playbackRate = tempo
      }
    }
  }

  setVolume(value: number) {
    this.currentVolume = clamp(value, 0, 1)
    if (this.volumeNode && this.ctx) {
      this.volumeNode.gain.setTargetAtTime(volumeCurve(this.currentVolume), this.ctx.currentTime, 0.02)
    }
  }

  resume() {
    this.ensure()
    if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume()
  }

  getFrequencyData(): Uint8Array | null {
    if (!this.analyser || !this.frequencyData) return null
    this.analyser.getByteFrequencyData(this.frequencyData)
    return this.frequencyData
  }

  getWaveformData(): Uint8Array | null {
    if (!this.analyser || !this.waveformData) return null
    this.analyser.getByteTimeDomainData(this.waveformData)
    return this.waveformData
  }

  /** Magnitud combinada del EQ (lineal) para dibujar la curva real. */
  getEqMagnitude(frequencies: Float32Array, out: Float32Array): boolean {
    if (!this.ctx || !this.toneFilters) return false
    const filters = [this.toneFilters.bass, this.toneFilters.mid, this.toneFilters.treble, ...this.bandFilters]
    const magnitude = new Float32Array(frequencies.length)
    const phase = new Float32Array(frequencies.length)
    out.fill(1)
    for (const filter of filters) {
      filter.getFrequencyResponse(frequencies, magnitude, phase)
      for (let i = 0; i < frequencies.length; i += 1) {
        out[i] *= magnitude[i]
      }
    }
    return true
  }

  get sampleRate(): number {
    return this.ctx?.sampleRate ?? 48000
  }
}

function volumeCurve(value: number): number {
  return Math.pow(clamp(value, 0, 1), 1.7)
}

let engine: AudioEngine | null = null

export function getEngine(): AudioEngine {
  if (!engine) engine = new AudioEngine()
  // Enganche de depuración, sólo en desarrollo.
  if (import.meta.env.DEV) {
    ;(window as unknown as { __audioModsEngine?: AudioEngine }).__audioModsEngine = engine
  }
  return engine
}

export type { StudioState }
